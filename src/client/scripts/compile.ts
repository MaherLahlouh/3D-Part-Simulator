const url = 'http://localhost:3001';
//------------------------------------------------dont forget to add jwt token for authentication-----------------------------
export interface HexiResult {
  stdout: string;
  stderr: string;
  hex: string;
}



export async function buildHex(source: string) {
  const token = localStorage.getItem('token');

  console.log("🚀 AVR EXECUTOR: Sending code to Hexi for compilation...");
  const resp = await fetch(url + '/arduino/compile', {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ sketch: source }),
  });
  return (await resp.json()) as HexiResult;
}
