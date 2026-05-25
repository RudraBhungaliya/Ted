(function() {
  // Prevent double injection
  if (document.getElementById("ted-overlay-container")) return;

  const container = document.createElement("div");
  container.id = "ted-overlay-container";
  
  // Set initial styles (Start button launcher size)
  Object.assign(container.style, {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: "120px",
    height: "40px",
    zIndex: "2147483647",
    border: "none",
    background: "transparent",
    borderRadius: "24px",
    boxShadow: "none",
    overflow: "hidden",
    transition: "width 0.15s ease-out, height 0.15s ease-out, border-radius 0.15s ease-out"
  });

  const shadow = container.attachShadow({ mode: "open" });
  
  const iframe = document.createElement("iframe");
  iframe.src = "http://localhost:3000/overlay";
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "none",
    background: "transparent"
  });
  shadow.appendChild(iframe);
  document.body.appendChild(container);

  // Keep track of panel dimensions and positioning
  let width = 120;
  let height = 40;
  let left = window.innerWidth - width - 24;
  let top = window.innerHeight - height - 24;
  let isCustomPositioned = false;

  function updateContainerStyle() {
    container.style.left = left + "px";
    container.style.top = top + "px";
    container.style.width = width + "px";
    container.style.height = height + "px";
    
    // Clear right/bottom so left/top are respected
    container.style.right = "auto";
    container.style.bottom = "auto";
  }

  // Handle window resize
  window.addEventListener("resize", () => {
    const maxX = window.innerWidth - width - 12;
    const maxY = window.innerHeight - height - 12;
    left = Math.max(12, Math.min(maxX, left));
    top = Math.max(12, Math.min(maxY, top));
    updateContainerStyle();
  });

  // Listen to postMessages from localhost iframe
  window.addEventListener("message", (e) => {
    if (!e.origin.startsWith("http://localhost:3000")) return;
    
    const data = e.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "TED_DRAG") {
      isCustomPositioned = true;
      left += data.deltaX;
      top += data.deltaY;
      
      const maxX = window.innerWidth - width - 12;
      const maxY = window.innerHeight - height - 12;
      left = Math.max(12, Math.min(maxX, left));
      top = Math.max(12, Math.min(maxY, top));
      updateContainerStyle();
    } 
    else if (data.type === "TED_RESIZE") {
      isCustomPositioned = true;
      const deltaX = data.deltaX;
      const deltaY = data.deltaY;
      const resizeType = data.resizeType;
      
      if (resizeType === "right" || resizeType === "both") {
        width = Math.max(200, Math.min(800, width + deltaX));
      }
      if (resizeType === "bottom" || resizeType === "both") {
        height = Math.max(100, Math.min(850, height + deltaY));
      }

      const maxX = window.innerWidth - width - 12;
      const maxY = window.innerHeight - height - 12;
      left = Math.max(12, Math.min(maxX, left));
      top = Math.max(12, Math.min(maxY, top));
      updateContainerStyle();
    }
    else if (data.type === "TED_STEALTH_TOGGLE") {
      isCustomPositioned = true;
      width = data.size.width;
      height = data.size.height;
      container.style.borderRadius = data.isStealth ? "16px" : "24px";
      
      const maxX = window.innerWidth - width - 12;
      const maxY = window.innerHeight - height - 12;
      left = Math.max(12, Math.min(maxX, left));
      top = Math.max(12, Math.min(maxY, top));
      updateContainerStyle();
    }
    else if (data.type === "TED_LAYOUT_UPDATE") {
      const prevW = width;
      const prevH = height;
      
      if (data.isRecording) {
        width = data.size.width;
        height = data.size.height;
        container.style.borderRadius = data.isStealth ? "16px" : "24px";
        container.style.boxShadow = "0 20px 40px rgba(0,0,0,0.5)";
      } else {
        width = 120;
        height = 40;
        container.style.borderRadius = "24px";
        container.style.boxShadow = "none";
      }

      if (prevW !== width || prevH !== height) {
        if (!isCustomPositioned) {
          left = window.innerWidth - width - 24;
          top = window.innerHeight - height - 24;
        } else {
          // Adjust position relative to the expansion/shrink delta
          const deltaW = width - prevW;
          const deltaH = height - prevH;
          left -= deltaW;
          top -= deltaH;
        }
        
        const maxX = window.innerWidth - width - 12;
        const maxY = window.innerHeight - height - 12;
        left = Math.max(12, Math.min(maxX, left));
        top = Math.max(12, Math.min(maxY, top));
      }
      updateContainerStyle();
    }
  });

  // Periodically PING container on start to trigger layout update
  let pingCount = 0;
  const pingInterval = setInterval(() => {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "PING" }, "*");
      pingCount++;
      if (pingCount > 5) clearInterval(pingInterval);
    }
  }, 1000);
})();
