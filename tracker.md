// ====================
// TRACKER.JS - Add this to your static site (2KB minified)
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

  trackEvent(eventType, data = {}, sync = false) {
    const event = {
      page: window.location.pathname,
      event: eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
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
    }
    
    if (event.event === 'page_exit') {
      summaryRef.child('totalTime').transaction((current) => (current || 0) + event.timeOnPage);
      summaryRef.child('totalScroll').transaction((current) => (current || 0) + event.maxScrollDepth);
      summaryRef.child('exits').transaction((current) => (current || 0) + 1);
    }
  }

  // Custom event tracking (e.g., button clicks)
  track(eventName, data = {}) {
    this.trackEvent(eventName, data);
  }
}

// ====================
// USAGE EXAMPLE
// ====================

// Initialize tracker with your Firebase config
const tracker = new PrivacyTracker({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

// Track custom events (optional)
document.getElementById('start-chat-btn')?.addEventListener('click', () => {
  tracker.track('chat_started');
});

document.getElementById('open-chat-box')?.addEventListener('click', () => {
  tracker.track('chat_box_opened');
});

// ====================
// FIREBASE SECURITY RULES
// ====================
/*
{
  "rules": {
    "analytics": {
      ".read": "auth != null", // Only authenticated dashboard users can read
      "events": {
        ".write": true, // Allow anonymous writes for tracking
        "$eventId": {
          ".validate": "newData.hasChildren(['page', 'event', 'timestamp'])"
        }
      },
      "pages": {
        ".write": true, // Allow anonymous writes for page summaries
        "$pageId": {
          ".validate": true
        }
      }
    }
  }
}
*/

// ====================
// QUERY EXAMPLES (Run in Firebase Console or Dashboard)
// ====================

/*
// Get total page views
firebase.database().ref('analytics/pages').once('value').then(snapshot => {
  const pages = snapshot.val();
  Object.entries(pages).forEach(([page, data]) => {
    console.log(`${page}: ${data.views} views`);
  });
});

// Get average time on page
firebase.database().ref('analytics/pages/chat_abc123').once('value').then(snapshot => {
  const data = snapshot.val();
  const avgTime = data.totalTime / data.exits;
  console.log(`Average time: ${avgTime}s`);
});

// Get average scroll depth
firebase.database().ref('analytics/pages/chat_abc123').once('value').then(snapshot => {
  const data = snapshot.val();
  const avgScroll = data.totalScroll / data.exits;
  console.log(`Average scroll: ${avgScroll}%`);
});

// Get all events for a specific page
firebase.database().ref('analytics/events')
  .orderByChild('page')
  .equalTo('/chat/abc123')
  .once('value')
  .then(snapshot => {
    const events = snapshot.val();
    console.log(events);
  });

// Get events in last 24 hours
const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
firebase.database().ref('analytics/events')
  .orderByChild('timestamp')
  .startAt(oneDayAgo)
  .once('value')
  .then(snapshot => {
    console.log(snapshot.val());
  });
*/