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
        this.progressBar.style.width = `${scrollProgress * 100}%`;
        
        // Hero section fade out
        if (scrollTop > 200) {
            this.heroSection.style.opacity = Math.max(0, 1 - (scrollTop - 200) / 300);
            this.scrollIndicator.style.opacity = Math.max(0, 1 - scrollTop / 200);
        } else {
            this.heroSection.style.opacity = 1;
            this.scrollIndicator.style.opacity = 1;
        }
        
        // Show search after some scroll
        if (scrollTop > 100) {
            this.floatingSearch.style.opacity = 1;
        } else {
            this.floatingSearch.style.opacity = 0;
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
        // Reduce particles on mobile for better performance
        const isMobile = window.innerWidth <= 768;
        const particleCount = isMobile ? 8 : 15;
        const particleInterval = isMobile ? 3000 : 2000;
        
        // Create floating particles
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createParticle();
            }, i * 1000);
        }
        
        // Continuously create new particles
        setInterval(() => {
            this.createParticle();
        }, particleInterval);
    }
    
    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random starting position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        
        // Random size variation
        const size = 2 + Math.random() * 3;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        this.particles.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 20000);
    }
    
    setupHeroAnimations() {
        // Animate hero section on load
        setTimeout(() => {
            this.heroSection.style.opacity = 1;
            this.heroSection.style.transform = 'translateY(0px)';
            this.scrollIndicator.style.opacity = 1;
        }, 500);
        
        // Splitting.js for character animation
        if (typeof Splitting !== 'undefined') {
            Splitting();
            
            // Animate each character
            const chars = document.querySelectorAll('.hero-title .char');
            chars.forEach((char, index) => {
                char.style.animationDelay = `${index * 0.1}s`;
                char.style.animation = 'charFadeIn 0.8s ease-out forwards';
            });
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
