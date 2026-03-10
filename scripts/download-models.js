const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

// Models to download
const MODELS = [
    {
        name: "vosk-model-small-en-in-0.4",
        url: "https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip",
    },
    {
        name: "vosk-model-small-hi-0.22",
        url: "https://alphacephei.com/vosk/models/vosk-model-small-hi-0.22.zip",
    },
    {
        name: "vosk-model-small-te-0.42",
        url: "https://alphacephei.com/vosk/models/vosk-model-small-te-0.42.zip",
    },
];

const ASSETS_DIR = path.resolve(__dirname, '../assets');

if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download: ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { }); // Delete the file async. (But we don't check the result)
            reject(err);
        });
    });
}

async function unzip(zipPath, destDir) {
    return new Promise((resolve, reject) => {
        // Check for platform-specific command
        const cmd = process.platform === 'win32'
            ? `powershell -command "Expand-Archive -Force '${zipPath}' '${destDir}'"`
            : `unzip -o "${zipPath}" -d "${destDir}"`;

        console.log(`Unzipping ${zipPath}...`);
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return reject(error);
            }
            resolve();
        });
    });
}

(async () => {
    console.log("Checking Vosk models...");

    for (const model of MODELS) {
        const modelPath = path.join(ASSETS_DIR, model.name);
        if (fs.existsSync(modelPath)) {
            console.log(`✅ ${model.name} already exists.`);
            continue;
        }

        const zipPath = path.join(ASSETS_DIR, `${model.name}.zip`);
        console.log(`⬇️ Downloading ${model.name}...`);

        try {
            await downloadFile(model.url, zipPath);
            console.log(`📦 Unzipping ${model.name}...`);
            await unzip(zipPath, ASSETS_DIR);

            // Cleanup zip
            fs.unlinkSync(zipPath);
            console.log(`✅ Installed ${model.name}`);
        } catch (e) {
            console.error(`❌ Failed to install ${model.name}:`, e);
        }
    }

    console.log("Done.");
})();
