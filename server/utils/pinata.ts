// [AURORA-BEGIN:pinata-util]
import fetch from 'node-fetch';
import FormData from 'form-data';

const PINATA_JWT = process.env.PINATA_JWT!;

export async function pinFile(name: string, data: Buffer, mime: string) {
  const form = new FormData();
  form.append('file', data, { filename: name, contentType: mime });
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form as any,
  });
  if (!res.ok) {
    throw new Error('pinFile failed');
  }
  const json: any = await res.json();
  return json.IpfsHash as string;
}

export async function pinJSON(name: string, json: any) {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({ pinataMetadata: { name }, pinataContent: json }),
  });
  if (!res.ok) {
    throw new Error('pinJSON failed');
  }
  const body = await res.json();
  return body.IpfsHash as string;
}

export const ipfsUri = (cid: string) => `ipfs://${cid}`;
export const ipfsGateway = (cid: string) => `${process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'}/${cid}`;
// [AURORA-END:pinata-util]
