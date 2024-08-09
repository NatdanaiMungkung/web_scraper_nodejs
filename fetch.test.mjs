import assert from "assert";
import { describe, it, beforeEach } from "node:test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock the commander program
const programMock = {
  version: function () {
    return this;
  },
  description: function () {
    return this;
  },
  option: function () {
    return this;
  },
  arguments: function (arg) {
    this.requiredArg = arg;
    return this;
  },
  action: function (fn) {
    this.actionFn = fn;
    return this;
  },
  parse: function (args) {
    if (!args.slice(2).length && this.requiredArg) {
      throw new Error(`error: missing required argument '${this.requiredArg}'`);
    }
    this.actionFn(args.slice(2), {});
  },
};

// Mock commander module
import { jest } from "@jest/globals";
jest.unstable_mockModule("commander", () => ({
  program: programMock,
}));

// Mock fs functions
const fsMock = {
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(false),
  statSync: jest.fn().mockReturnValue({ mtime: new Date() }),
};

jest.unstable_mockModule("fs", () => fsMock);

const mock = new MockAdapter(axios);

describe("Web Page Fetcher", () => {
  let fetchModule;

  beforeEach(async () => {
    // Reset mocks
    jest.resetModules();
    mock.reset();
    Object.values(fsMock).forEach((mockFn) => mockFn.mockClear());

    // Mock console methods
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
    };

    // Import the module for each test
    fetchModule = await import("./fetch.js");
  });

  it("fetches and saves a simple web page", async () => {
    const url = "https://example.com";
    const html = "<html><body><h1>Example</h1></body></html>";

    mock.onGet(url).reply(200, html);

    await programMock.parse(["node", "fetch.js", url]);

    expect(fsMock.mkdirSync).toHaveBeenCalled();
    expect(fsMock.writeFileSync).toHaveBeenCalled();
  });

  it("fetches and saves a web page with assets", async () => {
    const url = "https://example.com";
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="/styles.css">
          <script src="/script.js"></script>
        </head>
        <body>
          <h1>Example</h1>
          <img src="/image.jpg">
        </body>
      </html>
    `;

    mock.onGet(url).reply(200, html);
    mock
      .onGet("https://example.com/styles.css")
      .reply(200, "body { color: red; }");
    mock
      .onGet("https://example.com/script.js")
      .reply(200, 'console.log("Hello");');
    mock.onGet("https://example.com/image.jpg").reply(200, "image data");

    await programMock.parse(["node", "fetch.js", url]);

    expect(fsMock.mkdirSync).toHaveBeenCalledTimes(4); // main dir + 3 asset dirs
    expect(fsMock.writeFileSync).toHaveBeenCalledTimes(4); // index.html + 3 assets
  });

  it("handles errors when fetching", async () => {
    const url = "https://example.com";

    mock.onGet(url).reply(404);

    await programMock.parse(["node", "fetch.js", url]);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Error fetching https://example.com")
    );
  });

  it("generates metadata when flag is set", async () => {
    const url = "https://example.com";
    const html = `
      <html>
        <body>
          <a href="#">Link 1</a>
          <a href="#">Link 2</a>
          <img src="image1.jpg">
          <img src="image2.jpg">
        </body>
      </html>
    `;

    mock.onGet(url).reply(200, html);

    await programMock.parse(["node", "fetch.js", "--metadata", url]);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("num_links: 2")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("images: 2")
    );
  });

  it("throws an error when no URL is provided", async () => {
    await expect(programMock.parse(["node", "fetch.js"])).rejects.toThrow(
      "error: missing required argument 'urls'"
    );
  });
});
