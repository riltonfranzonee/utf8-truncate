import { appendFileSync, existsSync, readFileSync, unlinkSync } from "fs";

const utf8Truncate = () => {
  if (existsSync("output")) unlinkSync("output");

  const casesBuffer = readFileSync("cases");
  const lines: number[][] = [[]];

  casesBuffer.forEach((byte) => {
    if (byte === 0x0a) {
      lines.push([]);
      return;
    }
    lines[lines.length - 1].push(byte);
  });

  lines.forEach((line) => {
    const truncateSize = line[0];
    if (truncateSize === undefined) return;
    const lineBytes = line.slice(1);

    let usedBytes = 0;
    const truncatedBytes: number[] = [];

    lineBytes.forEach((byte, byteIndex) => {
      const isContinuingByte = byte >> 6 === 0b10;

      if (!isContinuingByte) {
        let bitsToSkip = 1;
        while (true) {
          const byteChange = byte >> (8 - bitsToSkip);
          const msb = byteChange & 0b1; // taking the first bit (reversed, which means the MSB)
          if (msb === 0) break;
          bitsToSkip++;
        }

        const bytesForThisChar = bitsToSkip > 1 ? bitsToSkip - 1 : 1;

        usedBytes += bytesForThisChar;

        if (usedBytes <= truncateSize) {
          for (let idx = byteIndex; idx < byteIndex + bytesForThisChar; idx++) {
            truncatedBytes.push(lineBytes[idx]);
          }
        }
      }
    });

    truncatedBytes.push(0x0a); // add line break at the end
    appendFileSync("output", Buffer.from(truncatedBytes), { encoding: "utf-8" });
  });
};

utf8Truncate();
