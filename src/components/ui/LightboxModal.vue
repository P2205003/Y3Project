// src/components/ui/LightboxModal.vue
<template>
  <transition name="lightbox-fade">
    <div v-if="isActive"
         id="lightbox-overlay"
         class="lightbox-overlay active"
         @click.self="closeModal"
         @keydown.esc="closeModal"
         tabindex="-1"
         ref="overlayRef">
      <div id="lightbox-content" class="lightbox-content" role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
        <!-- Close Button -->
        <button class="lightbox-close-btn" @click="closeModal" aria-label="Close lightbox">×</button>

        <!-- Image Display Area -->
        <div class="lightbox-image-container">
          <!-- Use a unique key for transition on image change -->
          <transition :name="transitionName" mode="out-in">
            <img :key="currentImageSrc" :src="currentImageSrc" :alt="imageAltText" class="lightbox-image" ref="lightboxImageRef">
          </transition>

          <!-- Title/Label (Optional but good for context) -->
          <div id="lightbox-title" class="lightbox-image-label sr-only">
            Image {{ currentInternalIndex + 1 }} of {{ images.length }}
          </div>

          <!-- Navigation Buttons (only if multiple images) -->
          <button v-if="images.length > 1"
                  class="lightbox-nav-btn prev"
                  @click="prevImage"
                  aria-label="Previous image">
            <font-awesome-icon icon="chevron-left" />
          </button>
          <button v-if="images.length > 1"
                  class="lightbox-nav-btn next"
                  @click="nextImage"
                  aria-label="Next image">
            <font-awesome-icon icon="chevron-right" />
          </button>
        </div>

        <!-- Optional: Thumbnails within lightbox (can be complex, skipping for now) -->
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
// Icons are already added to library in ProductDetailView

const props = defineProps({
  images: {
    type: Array,
    required: true,
    default: () => []
  },
  startIndex: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    required: true
  },
  imageAltText: {
    type: String,
    default: 'Enlarged product image'
  }
});

const emit = defineEmits(['close']);

const currentInternalIndex = ref(0);
const transitionName = ref('lightbox-slide-next'); // Default transition direction
const overlayRef = ref(null);
const lightboxImageRef = ref(null);

// Set initial index when activated
watch(() => props.isActive, async (newValue) => {
  if (newValue) {
    currentInternalIndex.value = props.startIndex >= 0 && props.startIndex < props.images.length ? props.startIndex : 0;
    window.addEventListener('keydown', handleKeydown);
    // Focus the overlay for keyboard controls after it renders
    await nextTick();
    overlayRef.value?.focus();
  } else {
    window.removeEventListener('keydown', handleKeydown);
  }
});

const currentImageSrc = computed(() => {
  return props.images[currentInternalIndex.value] || ''; // Handle empty array/index out of bounds
});

const closeModal = () => {
  emit('close');
};

const nextImage = () => {
  if (props.images.length <= 1) return;
  transitionName.value = 'lightbox-slide-next';
  currentInternalIndex.value = (currentInternalIndex.value + 1) % props.images.length;
};

const prevImage = () => {
  if (props.images.length <= 1) return;
  transitionName.value = 'lightbox-slide-prev';
  currentInternalIndex.value = (currentInternalIndex.value - 1 + props.images.length) % props.images.length;
};

const handleKeydown = (event) => {
  if (!props.isActive) return;
  switch (event.key) {
    case 'Escape':
      closeModal();
      break;
    case 'ArrowRight':
      nextImage();
      break;
    case 'ArrowLeft':
      prevImage();
      break;
  }
};

// Cleanup listener on unmount
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

</script>

<!-- Styles will be added to main.css -->
