// @ts-nocheck

const scene = window.scene;

// saveLoad.js - Final Clean & Secure Version
class RobotProjectManager {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.initFirebase();
  }

  // Purpose: Initialize Firebase Firestore database connection
  // Called from: RobotProjectManager constructor
  initFirebase() {
    const checkFirebase = () => {
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        this.db = firebase.firestore();
        firebase.auth().onAuthStateChanged(user => {
          this.currentUser = user;
          if (user) {
            console.log('🔐 User authenticated:', user.email);
          }
        });
        console.log('✅ Firebase initialized');
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  }

  // Purpose: Collect all robot data (parts, connections) for saving
  // Called from: saveRobot(), exportProject()
  collectRobotData() {
    try {
      if (!window.allParts || window.allParts.length === 0) {
        throw new Error('No components to save');
      }

      const parts = window.allParts
        .filter(container => container && !container._disposed)
        .map(container => ({
          fileName: container.metadata?.originalFileName || container.metadata?.fileName || 'unknown',
          id: container.name,
          position: {
            x: Math.round(container.position.x * 100) / 100,
            y: Math.round(container.position.y * 100) / 100,
            z: Math.round(container.position.z * 100) / 100
          },
          rotation: {
            x: Math.round(container.rotation.x * 100) / 100,
            y: Math.round(container.rotation.y * 100) / 100,
            z: Math.round(container.rotation.z * 100) / 100
          },
          parentId: container.parent?.name || null
        }));

      // const connections = window.connections || [];

        const connections = (typeof window.getWiringData === 'function')
        ? window.getWiringData()
        : (window.connections || []);



      return {
        parts,
        connections,
        totalComponents: parts.length,
        totalConnections: connections.length,
        savedAt: new Date().toISOString(),
        version: '2.0'
      };
    } catch (error) {
      console.error('❌ Error collecting robot data:', error);
      throw error;
    }
  }

  // Purpose: Save robot project to Firebase Firestore
  // Called from: Save button in UI, saveProject() function
  async saveRobot(projectName = null) {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      const robotData = this.collectRobotData();
      if (robotData.totalComponents === 0) {
        throw new Error('No components to save! Add components first.');
      }

      const name = projectName || prompt('Enter a name for your robot project:', 'My Robot Project');
      if (name === null) return null;

      const projectDoc = {
        userID: this.currentUser.uid,
        uid: this.currentUser.uid,
        name: name.trim(),
        projectName: name.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        data: robotData,
        version: '2.0'
      };

      const docRef = await this.db.collection('robots').add(projectDoc);
      console.log('✅ Robot saved with ID:', docRef.id);

      return {
        success: true,
        projectId: docRef.id,
        message: `"${name}" saved successfully!`
      };
    } catch (error) {
      console.error('❌ Error saving robot:', error);
      throw new Error('Failed to save project: ' + error.message);
    }
  }

  // Purpose: Load all projects for current user from Firebase
  // Called from: Project list UI, loadAllRobotProjects() global function
  async loadAllProjects() {
  if (!this.currentUser) throw new Error('User not authenticated');

  try {
    console.log('📂 Loading projects for user:', this.currentUser.uid);
    
    // Simple query without orderBy to avoid composite index requirement
    const snapshot = await this.db
      .collection('robots')
      .where('userID', '==', this.currentUser.uid)
      .get();

    const projects = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        projectName: data.name || data.projectName || 'Unnamed Project',
        totalComponents: data.data?.totalComponents || data.data?.parts?.length || 0,
        totalConnections: data.data?.totalConnections || data.data?.connections?.length || 0,
        createdAt: data.createdAt?.toDate() || null,
        updatedAt: data.updatedAt?.toDate() || null,
        data: data.data
      });
    });

    // Sort in JavaScript instead of Firestore query
    projects.sort((a, b) => {
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return b.updatedAt - a.updatedAt; // Descending order (newest first)
    });

    console.log(`✅ Loaded ${projects.length} projects`);
    return projects;
  } catch (error) {
    console.error('❌ Error loading projects:', error);
    throw new Error('Failed to load projects: ' + error.message);
  }
}
  // Purpose: Load a single project by ID from Firebase
  // Called from: Project list UI when user clicks a project
  async loadProject(projectId) {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      const doc = await this.db.collection('robots').doc(projectId).get();
      if (!doc.exists) throw new Error('Project not found');

      const data = doc.data();
      const ownsProject = data.userID === this.currentUser.uid ||
                          data.userId === this.currentUser.uid ||
                          data.uid === this.currentUser.uid;

      if (!ownsProject) throw new Error('Access denied: You do not own this project');

      return {
        id: doc.id,
        projectName: data.name || data.projectName || 'Unnamed Project',
        data: data.data,
        createdAt: data.createdAt?.toDate() || null,
        updatedAt: data.updatedAt?.toDate() || null
      };
    } catch (error) {
      console.error('❌ Error loading project:', error);
      throw error;
    }
  }

  // Purpose: Delete a project from Firebase (with ownership check)
  // Called from: Delete button in project list UI, deleteRobotProject() global function
  async deleteProject(projectId) {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      const doc = await this.db.collection('robots').doc(projectId).get();
      if (!doc.exists) throw new Error('Project not found');

      const data = doc.data();
      const ownsProject = data.userID === this.currentUser.uid ||
                          data.userId === this.currentUser.uid ||
                          data.uid === this.currentUser.uid;

      if (!ownsProject) throw new Error('Access denied: You do not own this project');

      await this.db.collection('robots').doc(projectId).delete();
      return { success: true, message: 'Project deleted successfully!' };
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      throw error;
    }
  }

  // Purpose: Load robot from data object (parts and connections)
  // Called from: loadProject() after fetching from Firebase, import functionality
  loadRobotFromData(robotData) {
    return new Promise((resolve, reject) => {
      try {
        if (typeof window.eraseAll === 'function') window.eraseAll();

        const partsToLoad = robotData.parts || robotData.components || [];
        if (partsToLoad.length === 0) {
          console.warn('⚠️ No parts to load');
          resolve();
          return;
        }

        let loadedCount = 0;
        const totalParts = partsToLoad.length;

        partsToLoad.forEach((partData, index) => {
          setTimeout(() => {
            this.loadSinglePart(partData)
              .then(() => {
                loadedCount++;
                if (loadedCount === totalParts) {
                  setTimeout(() => {
                    this.restoreConnections(partsToLoad);
                    this.restoreWiring(robotData.connections || robotData.wiring || []);
                    if (typeof window.updateComponentCount === 'function') {
                      window.updateComponentCount();
                    }
                    resolve({ success: true });
                  }, 500);
                }
              })
              .catch(err => {
                console.error('Failed to load part:', partData.fileName, err);
                loadedCount++;
                if (loadedCount === totalParts) resolve({ success: true, hasErrors: true });
              });
          }, index * 150);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Purpose: Load a single part from part data (position, rotation, filename)
  // Called from: loadRobotFromData() for each part in the project
  async loadSinglePart(partData) {
    return new Promise((resolve, reject) => {
      const fileName = partData.fileName || partData.originalFileName;
      if (!fileName || typeof window.simulatorLoadPart !== 'function') {
        reject(new Error('Invalid part'));
        return;
      }

      window.simulatorLoadPart(fileName)
        .then(container => {
          if (!container) return reject(new Error('Load failed'));

          if (partData.position) Object.assign(container.position, partData.position);
          if (partData.rotation) Object.assign(container.rotation, partData.rotation);
          container._originalId = partData.id;

          resolve(container);
        })
        .catch(reject);
    });
  }

  // Purpose: Restore parent-child connections between parts
  // Called from: loadRobotFromData() after all parts are loaded
  restoreConnections(partsData) {
    partsData.forEach(partData => {
      if (partData.parentId) {
        const child = window.allParts.find(p => p._originalId === partData.id);
        const parent = window.allParts.find(p => p._originalId === partData.parentId);
        if (child && parent) child.setParent(parent);
      }
    });
  }

  // Purpose: Restore wiring connections from saved data
  // Called from: loadRobotFromData() after parts and connections are restored
  restoreWiring(connections) {
    if (!connections || !window.restoreWiring) return;
    window.restoreWiring(scene, connections);
  }
}

// Global instance
window.robotProjectManager = new RobotProjectManager();

// Global functions
// Purpose: Global function to save robot project (wrapper for RobotProjectManager.saveRobot)
// Called from: Save button click handler in index.html
window.saveRobotProject = async function(projectName) {
  const btn = document.getElementById('saveRobotBtn');
  if (btn) {
    const original = btn.textContent;
    btn.textContent = '💾 Saving...';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 3000);
  }

  try {
    const result = await window.robotProjectManager.saveRobot(projectName);
    if (result?.success) {
      alert(result.message);
      if (btn) {
        btn.textContent = '✅ Saved!';
        setTimeout(() => { btn.textContent = '💾 Save Robot'; }, 2000);
      }
    }
    return result;
  } catch (error) {
    alert('Error saving robot: ' + error.message);
    if (btn) btn.textContent = '💾 Save Robot';
    throw error;
  }
};

window.loadRobotFromData = (data) => window.robotProjectManager.loadRobotFromData(data);
window.loadAllRobotProjects = () => window.robotProjectManager.loadAllProjects();
window.deleteRobotProject = (id) => window.robotProjectManager.deleteProject(id);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('saveRobotBtn');
  if (btn) btn.onclick = () => saveRobotProject();
  console.log('✅ Save/Load system ready');
});