const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const testUrl = "https://some.api";

const testDir = path.join(__dirname, "some.api");

describe("Fetch Web Page CLI", () => {

    beforeAll(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    afterAll(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    it("should create a folder for the webpage with the HTML and assets", () => {
        execSync(`node ${path.join(__dirname, '.', 'fetch.js')} --test ${testUrl}`, { stdio: 'inherit' });

        expect(fs.existsSync(testDir)).toBe(true);

        const htmlFilePath = path.join(testDir, "index.html");
        expect(fs.existsSync(htmlFilePath)).toBe(true);

        // Verify asset
        const savedHtml = fs.readFileSync(htmlFilePath, 'utf8');
        expect(savedHtml).toContain("src=\"image.jpg\"");
    });

    it("should display metadata for the fetched page", () => {
        const expectedMetadata = `site: some.api`;

        const output = execSync(`node ${path.join(__dirname, '.', 'fetch.js')} --test --metadata ${testUrl}`,
            { encoding: 'utf-8' }
        );

        expect(output).toContain(expectedMetadata);

    });
});
