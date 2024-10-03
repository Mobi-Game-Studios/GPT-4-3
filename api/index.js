const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const chromium = require("chrome-aws-lambda");

const app = express();
const PORT = 3000;

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

app.get("/api/response", async (req, res) => {
    const logs = []; // Array to store log messages
    try {
        const message = req.headers["message"];
        logs.push("Received message from header.");

        const browser = await chromium.puppeteer.launch({
            args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true,
            ignoreHTTPSErrors: true,
          })
        logs.push("Browser launched.");

        const page = await browser.newPage();
        logs.push("New page created.");

        await page.goto("https://www.chatgpt.com");
        logs.push("Navigated to ChatGPT.");

        // Wait for the textarea to load
        await page.waitForSelector("#prompt-textarea");
        logs.push("Prompt textarea is ready.");

        const result = await page.evaluate(async () => {
            function waitForButtonToBeDisabled(buttonClassName) {
                return new Promise((resolve, reject) => {
                    const interval = setInterval(() => {
                        const buttons = document.getElementsByClassName(buttonClassName);
                        if (buttons.length === 0) {
                            reject(new Error("Button not found"));
                            clearInterval(interval);
                            return;
                        }

                        const button = buttons[0];
                        if (button.disabled) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
            }

            document.getElementById("prompt-textarea").textContent = message;
            console.log("Set prompt textarea content.");

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds

            const buttons = document.getElementsByClassName(
                "mb-1 me-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:bg-white dark:text-black dark:focus-visible:outline-white disabled:dark:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary disabled:bg-[#D7D7D7]"
            );

            if (buttons.length > 0) {
                buttons[0].click();
                console.log("Clicked the first button.");
            } else {
                console.log("No buttons found.");
            }

            await waitForButtonToBeDisabled(
                "mb-1 me-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:bg-white dark:text-black dark:focus-visible:outline-white disabled:dark:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary disabled:bg-[#D7D7D7]"
            );

            console.log("Button is now disabled.");

            const elements = document.getElementsByClassName(
                "min-h-8 text-message flex w-full flex-col items-end gap-2 whitespace-normal break-words [.text-message+&]:mt-5"
            );
            return elements.length > 0 ? elements[elements.length - 1].textContent : "No elements found";
        });

        await browser.close();
        logs.push("Browser closed.");

        // Respond with the logs and the result
        res.json({ message, textContent: result, logs });
    } catch (error) {
        console.error("Error:", error.message);
        logs.push(`Error: ${error.message}`);
        res.status(500).json({ error: "An error occurred while processing the request, Please report this response to MOBI.", cause: error.message, logs });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
