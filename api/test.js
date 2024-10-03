const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 3000;

app.get("/api/mini/response", async (req, res) => {
    try {
        const message = req.headers["message"];

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto("https://www.chatgpt.com");

        // Wait for the page to load and then execute the script
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

                        const button = buttons[0]; // Get the first button from the collection
                        if (button.disabled) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
            }

            document.getElementById("prompt-textarea").textContent = "I've already seen the movie";

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds

            const buttons = document.getElementsByClassName(
                "mb-1 me-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:bg-white dark:text-black dark:focus-visible:outline-white disabled:dark:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary disabled:bg-[#D7D7D7]"
            );

            if (buttons.length > 0) {
                buttons[0].click(); // Click the first button in the collection
            }

            await waitForButtonToBeDisabled(
                "mb-1 me-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:bg-white dark:text-black dark:focus-visible:outline-white disabled:dark:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary disabled:bg-[#D7D7D7]"
            );

            const elements = document.getElementsByClassName(
                "min-h-8 text-message flex w-full flex-col items-end gap-2 whitespace-normal break-words [.text-message+&]:mt-5"
            );
            return elements.length > 0 ? elements[elements.length - 1].textContent : "No elements found";
        });

        await browser.close();

        res.json({ message, textContent: result });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "An error occurred while processing the request." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
