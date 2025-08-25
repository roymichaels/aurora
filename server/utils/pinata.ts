// [AURORA-BEGIN:pinata-util]

interface PinataPinResponse {
  IpfsHash: string;
}

function getPinataJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    const message = 'PINATA_JWT environment variable is not set';
    console.error(message);
    throw new Error(message);
  }
  return jwt;
}

export async function pinFile(name: string, data: Buffer, mime: string) {
  const form = new FormData();
  const file = new File([data as unknown as BlobPart], name, { type: mime });
  form.append('file', file);
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getPinataJwt()}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error('pinFile failed');
  }
  const json: PinataPinResponse = await res.json();
  return json.IpfsHash;
}

export async function pinJSON(name: string, json: unknown) {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${getPinataJwt()}`,
    },
    body: JSON.stringify({ pinataMetadata: { name }, pinataContent: json }),
  });
  if (!res.ok) {
    throw new Error('pinJSON failed');
  }
  const body: PinataPinResponse = await res.json();
  return body.IpfsHash;
}

export const ipfsUri = (cid: string) => `ipfs://${cid}`;
export const ipfsGateway = (cid: string) => `${process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'}/${cid}`;
// [AURORA-END:pinata-util]
