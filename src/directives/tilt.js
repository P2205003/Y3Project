// src/directives/tilt.js

import { ref } from 'vue'; // ref might not be strictly needed here, but useful pattern

// Default configuration matching original CSS/JS (or adjust as needed)
const DEFAULT_TILT_OPTIONS = {
  maxTilt: 4,           // Max tilt rotation (degrees)
  perspective: 1500,    // Transform perspective, the lower the more extreme the tilt gets (pixels)
  scale: 1.01,          // Scale on hover
  speed: 600,           // Speed of the enter/exit transition (milliseconds)
  shineOpacity: 0.15,   // How intense the shine overlay is (0-1)
  reset: true,          // If the tilt effect has to be reset on exit
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)', // Easing on enter/exit
  disabledAxis: '',     // 'x' or 'y' to disable tilting on a specific axis
};

// Helper to check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const tiltDirective = {
  // Called when the bound element is mounted into the DOM
  mounted(el, binding) {
    if (prefersReducedMotion) {
      // Skip setup if user prefers reduced motion
      // Apply base perspective for consistency if needed, but no dynamic tilt
      el.style.transform = `perspective(${DEFAULT_TILT_OPTIONS.perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
      return;
    }

    // Merge default options with any options passed in the binding value
    const options = {
      ...DEFAULT_TILT_OPTIONS,
      ...(binding.value || {}), // v-tilt="{ maxTilt: 5 }"
    };

    // Find the shine overlay within the element
    const shineOverlay = el.querySelector('.tilt-shine-overlay');

    // Prepare the element
    el.style.willChange = 'transform'; // Optimize rendering
    el.style.transform = `perspective(${options.perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`; // Initial state
    if (shineOverlay) {
      shineOverlay.style.willChange = 'background-position, opacity';
      shineOverlay.style.opacity = '0'; // Ensure hidden initially
    }

    // --- Event Handlers ---

    const handleMouseMove = (event) => {
      if (!el) return; // Element might be gone

      const rect = el.getBoundingClientRect();
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const mouseX = event.clientX - rect.left; // X position within the element.
      const mouseY = event.clientY - rect.top;  // Y position within the element.
      const centerX = width / 2;
      const centerY = height / 2;

      // Calculate rotation values (inverted Y axis for natural feel)
      let rotateX = options.disabledAxis !== 'x'
        ? ((mouseY - centerY) / centerY) * -options.maxTilt
        : 0;
      let rotateY = options.disabledAxis !== 'y'
        ? ((mouseX - centerX) / centerX) * options.maxTilt
        : 0;

      // Clamp rotation to maxTilt to prevent extreme values at edges if needed (optional)
      // rotateX = Math.max(Math.min(rotateX, options.maxTilt), -options.maxTilt);
      // rotateY = Math.max(Math.min(rotateY, options.maxTilt), -options.maxTilt);

      // Apply faster transition during movement
      el.style.transition = 'transform 0.05s linear'; // Faster transition while moving
      if (shineOverlay) {
        shineOverlay.style.transition = 'opacity 0.1s linear, background-position 0.05s linear';
      }

      // Request animation frame for smooth updates
      requestAnimationFrame(() => {
        if (!el) return;
        el.style.transform = `perspective(${options.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${options.scale})`;
        el.classList.add('is-tilting'); // Add class for potential CSS hooks

        if (shineOverlay) {
          // Calculate shine position (0-100%)
          const shineX = Math.max(Math.min((mouseX / width) * 100, 100), 0);
          const shineY = Math.max(Math.min((mouseY / height) * 100, 100), 0);
          shineOverlay.style.backgroundPosition = `${shineX}% ${shineY}%`;
          shineOverlay.style.opacity = options.shineOpacity;
        }
      });
    };

    const handleMouseLeave = () => {
      if (!el) return;

      // Apply slower transition on exit
      el.style.transition = `transform ${options.speed}ms ${options.easing}`;
      if (shineOverlay) {
        shineOverlay.style.transition = `opacity ${options.speed * 0.8}ms ease-out`; // Slightly faster opacity fade
      }

      // Request animation frame for reset
      requestAnimationFrame(() => {
        if (!el) return;
        if (options.reset) {
          el.style.transform = `perspective(${options.perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
          if (shineOverlay) {
            shineOverlay.style.opacity = '0';
            // Reset background position maybe? Optional.
            // shineOverlay.style.backgroundPosition = `50% 50%`;
          }
        }
        el.classList.remove('is-tilting');
      });
    };

    // --- Add Listeners ---
    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // --- Store handlers and options on the element for cleanup ---
    // This is crucial for the unmounted hook
    el._tilt = {
      handleMouseMove,
      handleMouseLeave,
      options // Store options if needed later (though not strictly necessary for cleanup)
    };
  },

  // Called when the bound element is unmounted from the DOM
  unmounted(el) {
    if (el._tilt) {
      // Remove event listeners
      el.removeEventListener('mousemove', el._tilt.handleMouseMove);
      el.removeEventListener('mouseleave', el._tilt.handleMouseLeave);
      // Clean up stored reference
      delete el._tilt;
      // console.log('Tilt listeners removed for:', el);
    }
    // Optionally reset inline styles if needed, though usually not necessary if element is removed
    // el.style.transform = '';
    // el.style.transition = '';
    // el.style.willChange = '';
  }
};

export default tiltDirective;
