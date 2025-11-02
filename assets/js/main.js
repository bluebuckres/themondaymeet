// Digital Bestiary Interactive Features
class DigitalBestiary {
    constructor() {
        this.scrollContainer = document.getElementById('scrollContainer');
        this.heroSection = document.getElementById('heroSection');
        this.progressBar = document.getElementById('progressBar');
        this.scrollIndicator = document.getElementById('scrollIndicator');
        this.floatingSearch = document.querySelector('.floating-search');
        this.searchInput = document.getElementById('searchInput');
        this.particles = document.getElementById('floatingParticles');
        
        this.init();
    }
    
    init() {
        this.setupScrollEffects();
        this.setupParticleSystem();
        this.setupHeroAnimations();
        this.setupCreatureAnimations();
        this.setupModalSystem();
        this.setupSearchFunctionality();
        this.setupTypedText();
        
        // Ensure z-index layering is correct
        document.body.style.position = 'relative';
        document.body.style.zIndex = '0';
    }
    
    setupScrollEffects() {
        let ticking = false;
        
        this.scrollContainer.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateScrollEffects();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    updateScrollEffects() {
        const scrollTop = this.scrollContainer.scrollTop;
        const maxScroll = this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight;
        const scrollProgress = scrollTop / maxScroll;
        
        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${scrollProgress * 100}%`;
        }
        
        // Hero section fade out
        if (scrollTop > 200) {
            if (this.heroSection) {
                this.heroSection.style.opacity = Math.max(0, 1 - (scrollTop - 200) / 300);
            }
            if (this.scrollIndicator) {
                this.scrollIndicator.style.opacity = Math.max(0, 1 - scrollTop / 200);
            }
        } else {
            if (this.heroSection) {
                this.heroSection.style.opacity = 1;
            }
            if (this.scrollIndicator) {
                this.scrollIndicator.style.opacity = 1;
            }
        }
        
        // Show search after some scroll
        if (scrollTop > 100) {
            if (this.floatingSearch) {
                this.floatingSearch.style.opacity = 1;
            }
        } else {
            if (this.floatingSearch) {
                this.floatingSearch.style.opacity = 0;
            }
        }
        
        // Animate sections as they come into view
        this.animateVisibleSections();
    }
    
    animateVisibleSections() {
        const sections = document.querySelectorAll('.creature-section');
        const viewportHeight = window.innerHeight;
        const scrollTop = this.scrollContainer.scrollTop;
        
        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + scrollTop;
            const sectionBottom = sectionTop + rect.height;
            
            // Check if section is in viewport
            const isVisible = sectionTop < scrollTop + viewportHeight && sectionBottom > scrollTop;
            
            if (isVisible) {
                section.style.opacity = 1;
                section.style.transform = 'translateY(0px)';
                section.classList.add('animate-in');
            } else if (sectionTop > scrollTop + viewportHeight) {
                // Section is below viewport
                section.style.opacity = 0.3;
                section.style.transform = 'translateY(50px)';
            }
        });
    }
    
    setupParticleSystem() {
        // Skip particle system if element doesn't exist
        if (!this.particles) {
            return;
        }
        
        // Significantly reduce particles for better performance
        const isMobile = window.innerWidth <= 768;
        const maxParticles = isMobile ? 3 : 6; // Reduced from 8/15
        const particleInterval = isMobile ? 5000 : 4000; // Increased interval
        
        this.activeParticles = 0;
        this.maxParticles = maxParticles;
        
        // Create initial particles with staggered timing
        for (let i = 0; i < maxParticles; i++) {
            setTimeout(() => {
                this.createParticle();
            }, i * 2000); // Spread out initial creation
        }
        
        // Only create new particles if below max count
        setInterval(() => {
            if (this.activeParticles < this.maxParticles) {
                this.createParticle();
            }
        }, particleInterval);
    }
    
    createParticle() {
        // Skip if particles container doesn't exist or max reached
        if (!this.particles || this.activeParticles >= this.maxParticles) {
            return;
        }
        
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random starting position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (12 + Math.random() * 8) + 's';
        
        // Random size variation - smaller particles
        const size = 1.5 + Math.random() * 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        this.particles.appendChild(particle);
        this.activeParticles++;
        
        // Remove particle after animation completes
        const duration = 15000; // 15 seconds
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
                this.activeParticles--;
            }
        }, duration);
    }
    
    setupHeroAnimations() {
        // Initialize on DOM content loaded
        this.init();
        
        // On mobile, periodically check and remove cursors
        if (window.innerWidth <= 768) {
            setInterval(() => {
                this.removeCursorsOnMobile();
            }, 1000);
        }
        
        // Animate hero section on load
        setTimeout(() => {
            if (this.heroSection) {
                this.heroSection.style.opacity = 1;
                this.heroSection.style.transform = 'translateY(0px)';
            }
            if (this.scrollIndicator) {
                this.scrollIndicator.style.opacity = 1;
            }
        }, 500);
        
        // Splitting.js for character animation - only on desktop
        const isMobile = window.innerWidth <= 768;
        
        if (typeof Splitting !== 'undefined' && !isMobile) {
            // Only apply splitting on desktop to prevent mobile corruption
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle && !heroTitle.classList.contains('mobile-safe-title')) {
                Splitting();
                
                // Animate each character
                const chars = document.querySelectorAll('.hero-title .char');
                chars.forEach((char, index) => {
                    char.style.animationDelay = `${index * 0.1}s`;
                    char.style.animation = 'charFadeIn 0.8s ease-out forwards';
                });
            }
        } else if (isMobile) {
            // Ensure text is properly displayed on mobile
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle) {
                heroTitle.style.opacity = '1';
                heroTitle.style.transform = 'none';
                heroTitle.innerHTML = 'The Monday Meet'; // Reset any corrupted text
            }
            
            // Remove any Typed.js cursors on mobile
            this.removeCursorsOnMobile();
        }
    }
    
    setupCreatureAnimations() {
        const letterCard = document.querySelector('.letter-card');
        
        if (letterCard) {
            // Add touch-friendly hover effects for mobile
            const isMobile = window.innerWidth <= 768;
            
            if (!isMobile) {
                // Desktop hover effects
                letterCard.addEventListener('mouseenter', () => {
                    letterCard.style.transform = 'translateY(-8px)';
                });
                
                letterCard.addEventListener('mouseleave', () => {
                    letterCard.style.transform = 'translateY(0px)';
                });
            } else {
                // Mobile touch effects
                letterCard.addEventListener('touchstart', () => {
                    letterCard.style.transform = 'scale(0.98)';
                });
                
                letterCard.addEventListener('touchend', () => {
                    letterCard.style.transform = 'scale(1)';
                });
            }
        }
    }
    
    setupModalSystem() {
        const modalOverlay = document.getElementById('modalOverlay');
        const closeButton = document.getElementById('closeButton');
        const creatureImages = document.querySelectorAll('.creature-image');
        
        if (!modalOverlay || !closeButton) {
            return;
        }
        
        creatureImages.forEach((image) => {
            image.addEventListener('click', (e) => {
                const creatureId = e.target.dataset.creature;
                this.openModal(creatureId);
            });
        });
        
        closeButton.addEventListener('click', () => {
            this.closeModal();
        });
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal();
            }
        });
    }
    
    openModal(creatureId) {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalCard = document.querySelector('.modal-card');
        
        modalOverlay.style.display = 'flex';
        setTimeout(() => {
            modalOverlay.style.opacity = 1;
            modalCard.style.transform = 'translateY(0px)';
        }, 10);
    }
    
    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalCard = document.querySelector('.modal-card');
        
        modalOverlay.style.opacity = 0;
        modalCard.style.transform = 'translateY(50px)';
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300);
    }
    
    setupSearchFunctionality() {
        // Skip if search input doesn't exist
        if (!this.searchInput) {
            return;
        }
        
        const creatures = document.querySelectorAll('.creature-section');
        
        this.searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            creatures.forEach((creature) => {
                const name = creature.querySelector('.creature-name').textContent.toLowerCase();
                const chinese = creature.querySelector('.creature-name-chinese').textContent.toLowerCase();
                const description = creature.querySelector('.creature-description').textContent.toLowerCase();
                
                const matches = name.includes(searchTerm) || 
                               chinese.includes(searchTerm) || 
                               description.includes(searchTerm);
                
                if (matches || searchTerm === '') {
                    creature.style.opacity = 1;
                    creature.style.filter = 'none';
                } else {
                    creature.style.opacity = 0.3;
                    creature.style.filter = 'blur(2px)';
                }
            });
        });
    }
    
    setupTypedText() {
        // Typed text functionality disabled
    }
    
    removeCursorsOnMobile() {
        // Remove all Typed.js cursor elements on mobile
        const cursors = document.querySelectorAll('.typed-cursor, .typed-cursor-text, .cursor, .blink, [class*="cursor"], [class*="blink"]');
        cursors.forEach(cursor => {
            cursor.remove();
        });
        
        // Also check for any elements that might contain cursor text
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.textContent && el.textContent.includes('|')) {
                // If it's just a cursor character, remove it
                if (el.textContent.trim() === '|') {
                    el.remove();
                } else if (el.textContent.endsWith('|')) {
                    // Remove trailing cursor from text
                    el.textContent = el.textContent.replace(/\|$/, '');
                }
            }
        });
        
        // Force hide typed-text container
        const typedText = document.getElementById('typedText');
        if (typedText) {
            typedText.style.display = 'none';
            typedText.innerHTML = '';
        }
    }
}

// Additional CSS animations via JavaScript
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes charFadeIn {
        from { 
            opacity: 0; 
            transform: translateY(20px) rotateX(90deg); 
        }
        to { 
            opacity: 1; 
            transform: translateY(0px) rotateX(0deg); 
        }
    }
    
    .animate-in {
        animation: slideInFromRight 0.8s ease-out forwards;
    }
    
    @keyframes slideInFromRight {
        from {
            transform: translateX(50px) rotateY(10deg);
            opacity: 0;
        }
        to {
            transform: translateX(0px) rotateY(0deg);
            opacity: 1;
        }
    }
    
    .creature-image {
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .creature-info {
        transition: all 0.3s ease;
    }
    
    .hero-section {
        transition: all 0.5s ease;
        z-index: 10;
    }
    
    .scroll-content * {
        position: relative;
        z-index: 5;
    }
`;
document.head.appendChild(additionalStyles);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DigitalBestiary();
});

// Typed text functionality disabled
