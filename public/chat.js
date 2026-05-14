// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// Chat state
let chatHistory = [];
let isProcessing = false;

// Auto resize textarea
userInput.addEventListener("input", function () {
	this.style.height = "auto";
	this.style.height = this.scrollHeight + "px";
});

// Enter send
userInput.addEventListener("keydown", function (e) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
});

sendButton.addEventListener("click", sendMessage);

// MAIN FUNCTION
async function sendMessage() {
	const message = userInput.value.trim();
	if (message === "" || isProcessing) return;

	isProcessing = true;
	userInput.disabled = true;
	sendButton.disabled = true;

	addMessageToChat("user", message);
	userInput.value = "";
	userInput.style.height = "auto";

	typingIndicator.classList.add("visible");

	// ==============================
	// 🖼 IMAGE GENERATION MODE
	// ==============================
	if (message.startsWith("/image")) {
		const prompt = message.replace("/image", "").trim();

		try {
			const response = await fetch("/api/image", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ prompt }),
			});

			if (!response.ok) throw new Error("Image failed");

			const blob = await response.blob();
			const imgURL = URL.createObjectURL(blob);

			addImageToChat(imgURL);

		} catch (error) {
			addMessageToChat("assistant", "❌ Image generate nahi ho saki");
		}
	}

	// ==============================
	// 💬 TEXT CHAT MODE
	// ==============================
	else {
		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: [
						...chatHistory,
						{ role: "user", content: message }
					],
				}),
			});

			if (!response.ok) throw new Error("Chat failed");

			const data = await response.json();
			const reply = data.response || "No response";

			addMessageToChat("assistant", reply);

			chatHistory.push({ role: "user", content: message });
			chatHistory.push({ role: "assistant", content: reply });

		} catch (error) {
			addMessageToChat("assistant", "❌ Error in chat response");
		}
	}

	typingIndicator.classList.remove("visible");

	isProcessing = false;
	userInput.disabled = false;
	sendButton.disabled = false;
	userInput.focus();
}

// ==============================
// TEXT MESSAGE ADD
// ==============================
function addMessageToChat(role, content) {
	const div = document.createElement("div");
	div.className = `message ${role}-message`;
	div.innerHTML = `<p>${content}</p>`;
	chatMessages.appendChild(div);
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==============================
// IMAGE MESSAGE ADD
// ==============================
function addImageToChat(src) {
	const div = document.createElement("div");
	div.className = "message assistant-message";

	div.innerHTML = `
		<p>🖼 Generated Image:</p>
		<img src="${src}" style="width:100%;border-radius:10px;margin-top:10px;">
	`;

	chatMessages.appendChild(div);
	chatMessages.scrollTop = chatMessages.scrollHeight;
}
