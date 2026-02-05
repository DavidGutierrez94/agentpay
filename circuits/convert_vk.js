// Convert snarkjs verification_key.json to Rust format for groth16-solana
// Usage: node convert_vk.js <input_vk.json> <output_name>

const ffjavascript = require('ffjavascript');
const { unstringifyBigInts, leInt2Buff } = ffjavascript.utils;
const fs = require("fs");

const inputPath = process.argv[2];
const outputName = process.argv[3] || "VERIFYINGKEY";

if (!inputPath) {
  console.error("Usage: node convert_vk.js <vk.json> [CONSTANT_NAME]");
  process.exit(1);
}

const mydata = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

// Convert alpha
for (let j = 0; j < mydata.vk_alpha_1.length; j++) {
  mydata.vk_alpha_1[j] = leInt2Buff(unstringifyBigInts(mydata.vk_alpha_1[j]), 32).reverse();
}

// Convert beta
for (let j = 0; j < mydata.vk_beta_2.length; j++) {
  let tmp = Array.from(leInt2Buff(unstringifyBigInts(mydata.vk_beta_2[j][0]), 32))
    .concat(Array.from(leInt2Buff(unstringifyBigInts(mydata.vk_beta_2[j][1]), 32)))
    .reverse();
  mydata.vk_beta_2[j][0] = tmp.slice(0, 32);
  mydata.vk_beta_2[j][1] = tmp.slice(32, 64);
}

// Convert gamma
for (let j = 0; j < mydata.vk_gamma_2.length; j++) {
  let tmp = Array.from(leInt2Buff(unstringifyBigInts(mydata.vk_gamma_2[j][0]), 32))
    .concat(Array.from(leInt2Buff(unstringifyBigInts(mydata.vk_gamma_2[j][1]), 32)))
    .reverse();
  mydata.vk_gamma_2[j][0] = tmp.slice(0, 32);
  mydata.vk_gamma_2[j][1] = tmp.slice(32, 64);
}

// Convert delta
for (let j = 0; j < mydata.vk_delta_2.length; j++) {
  let tmp = Array.from(leInt2Buff(unstringifyBigInts(mydata.vk_delta_2[j][0]), 32))
    .concat(Array.from(leInt2Buff(unstringifyBigInts(mydata.vk_delta_2[j][1]), 32)))
    .reverse();
  mydata.vk_delta_2[j][0] = tmp.slice(0, 32);
  mydata.vk_delta_2[j][1] = tmp.slice(32, 64);
}

// Convert IC
for (let j = 0; j < mydata.IC.length; j++) {
  for (let z = 0; z < mydata.IC[j].length; z++) {
    mydata.IC[j][z] = leInt2Buff(unstringifyBigInts(mydata.IC[j][z]), 32).reverse();
  }
}

// Generate Rust code
let s = `use groth16_solana::groth16::Groth16Verifyingkey;\n\npub const ${outputName}: Groth16Verifyingkey = Groth16Verifyingkey {\n\tnr_pubinputs: ${mydata.IC.length - 1},\n\n`;

s += "\tvk_alpha_g1: [\n";
for (let j = 0; j < mydata.vk_alpha_1.length - 1; j++) {
  s += "\t\t" + Array.from(mydata.vk_alpha_1[j]).toString() + ",\n";
}
s += "\t],\n\n";

s += "\tvk_beta_g2: [\n";
for (let j = 0; j < mydata.vk_beta_2.length - 1; j++) {
  for (let z = 0; z < 2; z++) {
    s += "\t\t" + Array.from(mydata.vk_beta_2[j][z]).toString() + ",\n";
  }
}
s += "\t],\n\n";

s += "\tvk_gamma_g2: [\n";
for (let j = 0; j < mydata.vk_gamma_2.length - 1; j++) {
  for (let z = 0; z < 2; z++) {
    s += "\t\t" + Array.from(mydata.vk_gamma_2[j][z]).toString() + ",\n";
  }
}
s += "\t],\n\n";

s += "\tvk_delta_g2: [\n";
for (let j = 0; j < mydata.vk_delta_2.length - 1; j++) {
  for (let z = 0; z < 2; z++) {
    s += "\t\t" + Array.from(mydata.vk_delta_2[j][z]).toString() + ",\n";
  }
}
s += "\t],\n\n";

s += "\tvk_ic: &[\n";
for (let ic = 0; ic < mydata.IC.length; ic++) {
  s += "\t\t[\n";
  for (let j = 0; j < mydata.IC[ic].length - 1; j++) {
    s += "\t\t\t" + mydata.IC[ic][j].toString() + ",\n";
  }
  s += "\t\t],\n";
}
s += "\t]\n};";

process.stdout.write(s);
