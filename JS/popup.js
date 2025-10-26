function createPopup(content, status = "warning") {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");

    const popup = document.createElement("div");
    popup.classList.add("popup");

    popup.innerHTML = `
        <div>
            <img style="height: 60px; width: 60px;" src="../../Assets/${status}.png">
            <br/>
            <p>${content}</p>
            <br/>
            <button class="close-btn">Ok</button>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Trigger CSS transitions
    requestAnimationFrame(() => {
        overlay.classList.add("show");
        popup.classList.add("show");
    });

    popup.querySelector(".close-btn").addEventListener("click", () => {
        overlay.classList.remove("show");
        popup.classList.remove("show");

        // Wait for transition to complete before removing
        setTimeout(() => {
            popup.remove();
            overlay.remove();
        }, 300); // Match transition duration
    });
}
