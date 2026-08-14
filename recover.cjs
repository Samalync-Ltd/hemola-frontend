const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function recover() {
    const transcriptPath = 'C:\\Users\\mustafa\\.gemini\\antigravity-ide\\brain\\198850a8-4704-44c8-9d5d-d28988cb1099\\.system_generated\\logs\\transcript_full.jsonl';
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const fsMap = new Map();

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const entry = JSON.parse(line);
            if (entry.tool_calls) {
                for (const call of entry.tool_calls) {
                    if (call.name === 'write_to_file' || call.name === 'replace_file_content') {
                        const args = call.args;
                        if (args && args.TargetFile) {
                            let targetFile = args.TargetFile;
                            if (typeof targetFile === 'string' && targetFile.startsWith('"')) {
                                targetFile = JSON.parse(targetFile);
                            }
                            
                            if (call.name === 'write_to_file' && args.CodeContent !== undefined) {
                                let codeContent = args.CodeContent;
                                if (typeof codeContent === 'string' && codeContent.startsWith('"')) {
                                    codeContent = JSON.parse(codeContent);
                                }
                                fsMap.set(targetFile.toLowerCase().replace(/\\/g, '/'), codeContent);
                            } else if (call.name === 'replace_file_content' && args.ReplacementContent !== undefined) {
                                let replacementContent = args.ReplacementContent;
                                if (typeof replacementContent === 'string' && replacementContent.startsWith('"')) {
                                    replacementContent = JSON.parse(replacementContent);
                                }
                                const startLine = typeof args.StartLine === 'string' && args.StartLine.startsWith('"') ? JSON.parse(args.StartLine) : args.StartLine;
                                const endLine = typeof args.EndLine === 'string' && args.EndLine.startsWith('"') ? JSON.parse(args.EndLine) : args.EndLine;
                                
                                const key = targetFile.toLowerCase().replace(/\\/g, '/');
                                let content = fsMap.get(key) || '';
                                let lines = content.split(/\r?\n/);
                                let newLines = replacementContent.split(/\r?\n/);
                                lines.splice(parseInt(startLine) - 1, parseInt(endLine) - parseInt(startLine) + 1, ...newLines);
                                fsMap.set(key, lines.join('\n'));
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing line:', e);
        }
    }

    console.log(`Recovered ${fsMap.size} files in memory. Writing to disk...`);
    let recoveredCount = 0;
    
    for (const [filePath, content] of fsMap.entries()) {
        if (filePath.includes('/src/') && filePath.endsWith('.css')) {
            const match = filePath.match(/hemola-frontend\/(src\/.*)$/i);
            if (match) {
                const relativePath = match[1];
                const fullPath = path.join(__dirname, relativePath);
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, content);
                recoveredCount++;
                console.log('Recovered', relativePath);
            }
        }
    }
    console.log(`Successfully recovered ${recoveredCount} files into src/`);
}

recover().catch(console.error);
