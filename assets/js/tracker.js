// ====================
// PRIVACY TRACKER - Love Letter Analytics
// ====================

class PrivacyTracker {
  constructor(firebaseConfig) {
    this.config = firebaseConfig;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.scrollDepth = 0;
    this.events = [];
    this.db = null;
    
    this.init();
  }

  // Generate anonymous session ID (not tied to user)
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  async init() {
    // Load Firebase SDK dynamically
    await this.loadFirebase();
    
    // Initialize Firebase
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(this.config);
    }
    this.db = window.firebase.database();

    // Track page view immediately
    this.trackEvent('page_view');

    // Setup event listeners
    this.setupScrollTracking();
    this.setupTimeTracking();
    this.setupExitTracking();
    this.setupCustomEvents();
  }

  async loadFirebase() {
    return new Promise((resolve) => {
      if (window.firebase) {
        resolve();
        return;
      }

      const script1 = document.createElement('script');
      script1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
      script1.async = true;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
      script2.async = true;
      document.head.appendChild(script2);

      script2.onload = () => resolve();
    });
  }

  setupScrollTracking() {
    let scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
    
    const checkScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercentage = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

      this.scrollDepth = Math.max(this.scrollDepth, scrollPercentage);

      // Track milestones
      Object.keys(scrollMilestones).forEach(milestone => {
        if (scrollPercentage >= parseInt(milestone) && !scrollMilestones[milestone]) {
          scrollMilestones[milestone] = true;
          this.trackEvent('scroll', { depth: parseInt(milestone) });
        }
      });
    };

    // Throttle scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkScroll, 200);
    });
  }

  setupTimeTracking() {
    // Track time milestones: 10s, 30s, 60s, 120s
    const timeMilestones = [10000, 30000, 60000, 120000];
    
    timeMilestones.forEach(milestone => {
      setTimeout(() => {
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        this.trackEvent('time_on_page', { seconds: elapsed });
      }, milestone);
    });
  }

  setupExitTracking() {
    // Track when user leaves
    const sendExitData = () => {
      const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);
      this.trackEvent('page_exit', {
        timeOnPage,
        maxScrollDepth: this.scrollDepth
      }, true); // Force synchronous send
    };

    // Use sendBeacon for reliable exit tracking
    window.addEventListener('beforeunload', sendExitData);
    window.addEventListener('pagehide', sendExitData);
    
    // Also track visibility changes (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        sendExitData();
      }
    });
  }

  setupCustomEvents() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', () => {
      // Track "Test the Waters" button clicks
      const chatButton = document.querySelector('a[href="/chat.html"], a[href="chat.html"]');
      if (chatButton) {
        chatButton.addEventListener('click', () => {
          this.trackEvent('button_click', { 
            button: 'test_the_waters',
            destination: 'anonymous_chat'
          });
        });
      }

      // Track "Dive In" WhatsApp button clicks
      const whatsappButton = document.querySelector('a[href*="wa.me"]');
      if (whatsappButton) {
        whatsappButton.addEventListener('click', () => {
          this.trackEvent('button_click', { 
            button: 'dive_in',
            destination: 'whatsapp'
          });
        });
      }

      // Track contact section visibility
      const contactSection = document.querySelector('.contact-question');
      if (contactSection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.trackEvent('section_view', { section: 'contact_cta' });
            }
          });
        });
        observer.observe(contactSection);
      }
    });
  }

  trackEvent(eventType, data = {}, sync = false) {
    const event = {
      page: window.location.pathname,
      event: eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      ...data
    };

    if (!this.db) {
      console.warn('Firebase not initialized yet');
      return;
    }

    // Send to Firebase
    const eventRef = this.db.ref('analytics/events').push();
    
    if (sync) {
      // Use sendBeacon for synchronous requests (on page exit)
      const url = `${this.config.databaseURL}/analytics/events.json`;
      const payload = JSON.stringify({ [eventRef.key]: event });
      navigator.sendBeacon(url, payload);
    } else {
      eventRef.set(event).catch(err => console.error('Tracking error:', err));
    }

    // Also update page summary for quick queries
    this.updatePageSummary(event);
  }

  updatePageSummary(event) {
    const pageKey = event.page.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '') || 'home';
    const summaryRef = this.db.ref(`analytics/pages/${pageKey}`);

    // Use transaction to safely update counters
    if (event.event === 'page_view') {
      summaryRef.child('views').transaction((current) => (current || 0) + 1);
      summaryRef.child('lastView').set(Date.now());
    }
    
    if (event.event === 'page_exit') {
      summaryRef.child('totalTime').transaction((current) => (current || 0) + event.timeOnPage);
      summaryRef.child('totalScroll').transaction((current) => (current || 0) + event.maxScrollDepth);
      summaryRef.child('exits').transaction((current) => (current || 0) + 1);
    }

    if (event.event === 'button_click') {
      summaryRef.child(`clicks_${event.button}`).transaction((current) => (current || 0) + 1);
    }
  }

  // Custom event tracking (e.g., button clicks)
  track(eventName, data = {}) {
    this.trackEvent(eventName, data);
  }
}

// Make it available globally
window.PrivacyTracker = PrivacyTracker;
