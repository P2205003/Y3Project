<template>
  <footer>
    <div class="footer-content">
      <div class="footer-column">
        <h3>AURORA</h3>
        <p>Crafting sustainable furniture that inspires connection and brightens everyday life.</p>
        <div class="social-links">
          <a href="#" aria-label="Instagram"><font-awesome-icon :icon="['fab', 'instagram']" /></a>
          <a href="#" aria-label="Pinterest"><font-awesome-icon :icon="['fab', 'pinterest']" /></a>
          <a href="#" aria-label="Twitter"><font-awesome-icon :icon="['fab', 'twitter']" /></a>
          <a href="#" aria-label="Facebook"><font-awesome-icon :icon="['fab', 'facebook-f']" /></a>
        </div>
      </div>
      <!-- Shop column remains removed from original index.html -->
      <!-- Example static columns -->
      <div class="footer-column">
        <h3>About</h3>
        <ul>
          <li><a href="#">Our Story</a></li>
          <li><a href="#">Sustainability</a></li>
          <li><a href="#">Design Process</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Press</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h3>Support</h3>
        <ul>
          <li><a href="#">Contact Us</a></li>
          <li><a href="#">FAQs</a></li>
          <li><a href="#">Shipping & Returns</a></li>
          <li><a href="#">Warranty</a></li>
          <li><a href="#">Trade Program</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>Contact Us: <a href="mailto:hello@aurorafurnishings.example">hello@aurorafurnishings.example</a> | (555) 123-4567</p>
      <p>© {{ currentYear }} AURORA Furnishings. All Rights Reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
// Import brand icons if needed and register in main.js
// import { faInstagram, faPinterest, faTwitter, faFacebookF } from '@fortawesome/free-brands-svg-icons'
// library.add(faInstagram, faPinterest, faTwitter, faFacebookF)

const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped>

</style>
