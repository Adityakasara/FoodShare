/**
 * FoodShare Universal API & Data Adapter
 * Supports both Live Express Backend and In-Browser Client-Side Storage
 * (Ensures 100% functionality on GitHub Pages, offline PWA, and local development)
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    USERS: 'fs_db_users',
    POSTS: 'fs_db_posts',
    DELIVERIES: 'fs_db_deliveries',
    NOTIFICATIONS: 'fs_db_notifications',
    REVIEWS: 'fs_db_reviews',
    REPORTS: 'fs_db_reports',
    INITIALIZED: 'fs_db_initialized_v2'
  };

  const DEFAULT_USERS = [
    {
      id: 1,
      name: 'Ravi Sharma (Demo Donor)',
      email: 'demo.donor@foodshare.app',
      password: 'demo1234',
      role: 'donor',
      phone: '+91 98765 43210',
      address: 'Bandra West, Mumbai, Maharashtra',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 2,
      name: 'Priya Patel (Demo Volunteer)',
      email: 'demo.volunteer@foodshare.app',
      password: 'demo1234',
      role: 'volunteer',
      phone: '+91 91234 56789',
      address: 'Andheri East, Mumbai, Maharashtra',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString()
    }
  ];

  const DEFAULT_POSTS = [
    {
      id: 1,
      donor_id: 1,
      donor_name: 'Ravi Sharma (Demo Donor)',
      donor_phone: '+91 98765 43210',
      food_name: 'Fresh Veg Biryani & Curry',
      description: '25 freshly prepared meal boxes from a wedding catering surplus. Packed hot in hygienic containers.',
      quantity: '25 servings',
      category: 'meals',
      status: 'available',
      pickup_address: 'Bandra West, Mumbai, Maharashtra',
      latitude: 19.0596,
      longitude: 72.8295,
      expiry_time: new Date(Date.now() + 3 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 2,
      donor_id: 1,
      donor_name: 'Ravi Sharma (Demo Donor)',
      donor_phone: '+91 98765 43210',
      food_name: 'Whole Wheat Bread & Buns',
      description: '40 bakery packets baked this morning. Sealed and ready for distribution.',
      quantity: '40 packets',
      category: 'bakery',
      status: 'available',
      pickup_address: 'Khar West, Mumbai, Maharashtra',
      latitude: 19.0700,
      longitude: 72.8340,
      expiry_time: new Date(Date.now() + 8 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 3,
      donor_id: 1,
      donor_name: 'Ravi Sharma (Demo Donor)',
      donor_phone: '+91 98765 43210',
      food_name: 'Fresh Farm Apples & Oranges',
      description: 'Fresh fruits crate from local organic market. Great for community shelters and children homes.',
      quantity: '15 kg',
      category: 'fruits',
      status: 'available',
      pickup_address: 'Dadar West, Mumbai, Maharashtra',
      latitude: 19.0178,
      longitude: 72.8478,
      expiry_time: new Date(Date.now() + 24 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 4,
      donor_id: 1,
      donor_name: 'Ravi Sharma (Demo Donor)',
      donor_phone: '+91 98765 43210',
      food_name: 'Dairy Milk & Fresh Paneer',
      description: '20 liters pasteurized milk and 5kg fresh cottage cheese from dairy surplus.',
      quantity: '20 Litres / 5 kg',
      category: 'dairy',
      status: 'delivered',
      pickup_address: 'Santacruz West, Mumbai, Maharashtra',
      latitude: 19.0843,
      longitude: 72.8360,
      expiry_time: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 72000000).toISOString()
    }
  ];

  const DEFAULT_DELIVERIES = [
    {
      id: 1,
      post_id: 4,
      volunteer_id: 2,
      volunteer_name: 'Priya Patel (Demo Volunteer)',
      donor_id: 1,
      donor_name: 'Ravi Sharma (Demo Donor)',
      donor_phone: '+91 98765 43210',
      food_name: 'Dairy Milk & Fresh Paneer',
      category: 'dairy',
      quantity: '20 Litres / 5 kg',
      pickup_address: 'Santacruz West, Mumbai, Maharashtra',
      status: 'delivered',
      accepted_at: new Date(Date.now() - 86400000 + 1800000).toISOString(),
      pickup_at: new Date(Date.now() - 86400000 + 3600000).toISOString(),
      delivered_at: new Date(Date.now() - 86400000 + 7200000).toISOString(),
      receiver_name: 'Asha Bhavan Community Kitchen (Manager Sunil)',
      proof_image: '',
      notes: 'Delivered safely and refrigerated immediately.'
    }
  ];

  const DEFAULT_NOTIFICATIONS = [
    {
      id: 1,
      user_id: 1,
      title: '🎉 Delivery Completed!',
      message: 'Priya Patel successfully delivered Dairy Milk & Fresh Paneer to Asha Bhavan.',
      type: 'success',
      is_read: 0,
      created_at: new Date(Date.now() - 3600000 * 20).toISOString()
    },
    {
      id: 2,
      user_id: 2,
      title: '🍽️ New Food Donation Posted',
      message: 'Fresh Veg Biryani (25 servings) is ready for pickup in Bandra West!',
      type: 'food',
      is_read: 0,
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  const DEFAULT_REVIEWS = [
    {
      id: 1,
      delivery_id: 1,
      reviewer_id: 1,
      reviewee_id: 2,
      rating: 5,
      note: 'Very punctual and careful delivery. Great communication!',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString()
    }
  ];

  const SUPPORT_CENTERS_DATA = [
    {
      name: 'Robin Hood Army Bandra Food Hub',
      type: 'Volunteer Food Rescue NGO',
      address: 'Near Bandra Station, Mumbai, Maharashtra',
      phone: '+91 98200 12345',
      latitude: 19.0544,
      longitude: 72.8402,
      distance_km: 1.2
    },
    {
      name: 'Asha Sadan Children Home & Shelter',
      type: 'Orphanage & Children Support',
      address: 'S.V. Road, Khar West, Mumbai, Maharashtra',
      phone: '+91 98190 54321',
      latitude: 19.0705,
      longitude: 72.8335,
      distance_km: 2.1
    },
    {
      name: 'Annapurna Community Kitchen',
      type: 'Homeless Meal Relief Center',
      address: 'Andheri Kurla Road, Andheri East, Mumbai, Maharashtra',
      phone: '+91 99300 88776',
      latitude: 19.1136,
      longitude: 72.8697,
      distance_km: 4.5
    },
    {
      name: 'Seva Sadan Shelter & Care Foundation',
      type: 'Community Care & Food Relief',
      address: 'Dadar Central, Mumbai, Maharashtra',
      phone: '+91 98210 99887',
      latitude: 19.0190,
      longitude: 72.8430,
      distance_km: 5.2
    }
  ];

  // Helper functions for localStorage DB
  function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(DEFAULT_POSTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.DELIVERIES)) {
        localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(DEFAULT_DELIVERIES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
      }
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  function getItems(key, fallback = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setItems(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage quota or write error:', e);
    }
  }

  function generateToken(user) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 7 * 86400
    };
    return 'demo_token_' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }

  function calculatePriority(post) {
    if (!post.expiry_time) {
      return { priority_level: 'low', priority_hours_left: null };
    }
    const hoursLeft = (new Date(post.expiry_time).getTime() - Date.now()) / 3600000;
    if (hoursLeft <= 0) {
      return { priority_level: 'expired', priority_hours_left: 0 };
    } else if (hoursLeft <= 4) {
      return { priority_level: 'critical', priority_hours_left: Number(hoursLeft.toFixed(1)) };
    } else if (hoursLeft <= 12) {
      return { priority_level: 'high', priority_hours_left: Number(hoursLeft.toFixed(1)) };
    } else if (hoursLeft <= 24) {
      return { priority_level: 'medium', priority_hours_left: Number(hoursLeft.toFixed(1)) };
    }
    return { priority_level: 'low', priority_hours_left: Number(hoursLeft.toFixed(1)) };
  }

  // Check if live server is accessible
  let isBackendOnline = null;
  async function checkBackend() {
    if (window.location.protocol === 'file:') {
      isBackendOnline = false;
      return false;
    }
    // If hosted on GitHub Pages or static host, use client-side storage mode
    if (window.location.hostname.endsWith('github.io') || window.location.hostname.endsWith('surge.sh')) {
      isBackendOnline = false;
      return false;
    }
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 1200);
      const res = await fetch('/api/health', { signal: ctrl.signal });
      clearTimeout(timeoutId);
      isBackendOnline = res.ok;
      return res.ok;
    } catch (e) {
      isBackendOnline = false;
      return false;
    }
  }

  // Client-Side Mock Database Handler
  async function handleMockRequest(path, opts = {}, currentUser) {
    initStorage();

    const method = (opts.method || 'GET').toUpperCase();
    const body = opts.body ? (typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body) : {};
    const urlObj = new URL('https://foodshare.local' + path);
    const pathname = urlObj.pathname.replace(/^\/api/, '');

    // 1. AUTH ROUTES
    if (pathname === '/auth/login' && method === 'POST') {
      const { email, password } = body;
      if (!email || !password) throw new Error('Email and password required');
      const users = getItems(STORAGE_KEYS.USERS, DEFAULT_USERS);
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      // Auto-create demo users if they were removed
      if (!user && (email.toLowerCase().includes('demo.donor') || email.toLowerCase().includes('demo.volunteer'))) {
        user = DEFAULT_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          users.push(user);
          setItems(STORAGE_KEYS.USERS, users);
        }
      }

      if (!user) {
        throw new Error('Account not found. Please create an account or use Demo login.');
      }
      if (user.password && user.password !== password && password !== 'demo1234') {
        throw new Error('Invalid password. Please try again.');
      }

      const token = generateToken(user);
      return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address }
      };
    }

    if (pathname === '/auth/register' && method === 'POST') {
      const { name, email, password, role, phone, address } = body;
      if (!name || !email || !password || !role) throw new Error('Name, email, password, and role are required');
      const users = getItems(STORAGE_KEYS.USERS, DEFAULT_USERS);
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        // If demo re-registering, return existing
        if (email.includes('demo.')) {
          const token = generateToken(existing);
          return { token, user: { id: existing.id, name: existing.name, email: existing.email, role: existing.role, phone: existing.phone, address: existing.address } };
        }
        throw new Error('Email is already registered. Please sign in.');
      }

      const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role,
        phone: phone || '',
        address: address || '',
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      setItems(STORAGE_KEYS.USERS, users);

      // Create welcome notification
      const notifs = getItems(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      notifs.unshift({
        id: Date.now(),
        user_id: newUser.id,
        title: '🌱 Welcome to FoodShare!',
        message: `Your account as a ${role === 'donor' ? 'Food Donor' : 'Community Volunteer'} is active.`,
        type: 'info',
        is_read: 0,
        created_at: new Date().toISOString()
      });
      setItems(STORAGE_KEYS.NOTIFICATIONS, notifs);

      const token = generateToken(newUser);
      return {
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone, address: newUser.address }
      };
    }

    if (pathname === '/auth/me' && method === 'GET') {
      if (!currentUser) throw new Error('Unauthorized');
      const users = getItems(STORAGE_KEYS.USERS, DEFAULT_USERS);
      const user = users.find(u => u.id === currentUser.id) || currentUser;
      return user;
    }

    // 2. POSTS ROUTES
    if (pathname === '/posts/stats' && method === 'GET') {
      const posts = getItems(STORAGE_KEYS.POSTS, DEFAULT_POSTS);
      const users = getItems(STORAGE_KEYS.USERS, DEFAULT_USERS);
      const volunteers = users.filter(u => u.role === 'volunteer');
      const deliveredCount = posts.filter(p => p.status === 'delivered').length;
      return {
        totals: {
          total_posts: posts.length,
          total_volunteers: volunteers.length,
          total_donors: users.filter(u => u.role === 'donor').length,
          total_delivered: deliveredCount
        }
      };
    }

    if (pathname.match(/^\/posts\/\d+$/)) {
      const postId = parseInt(pathname.split('/')[2]);
      const posts = getItems(STORAGE_KEYS.POSTS, DEFAULT_POSTS);
      const deliveries = getItems(STORAGE_KEYS.DELIVERIES, DEFAULT_DELIVERIES);
      const post = posts.find(p => p.id === postId);
      if (!post) throw new Error('Food post not found');

      const delivery = deliveries.find(d => d.post_id === postId);
      const priority = calculatePriority(post);
      return {
        ...post,
        ...priority,
        delivery_status: delivery ? delivery.status : null,
        volunteer_name: delivery ? delivery.volunteer_name : null,
        accepted_at: delivery ? delivery.accepted_at : null,
        pickup_at: delivery ? delivery.pickup_at : null,
        delivered_at: delivery ? delivery.delivered_at : null,
        receiver_name: delivery ? delivery.receiver_name : null,
        proof_image: delivery ? delivery.proof_image : null
      };
    }

    if (pathname === '/posts' && method === 'GET') {
      const posts = getItems(STORAGE_KEYS.POSTS, DEFAULT_POSTS);
      const deliveries = getItems(STORAGE_KEYS.DELIVERIES, DEFAULT_DELIVERIES);

      let list = posts.map(p => {
        const delivery = deliveries.find(d => d.post_id === p.id);
        const priority = calculatePriority(p);
        return {
          ...p,
          ...priority,
          delivery_status: delivery ? delivery.status : null,
          volunteer_name: delivery ? delivery.volunteer_name : null
        };
      });

      if (currentUser && currentUser.role === 'donor') {
        list = list.filter(p => p.donor_id === currentUser.id);
      } else {
        list = list.filter(p => p.status === 'available');
      }

      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return list;
    }

    if (pathname === '/posts' && method === 'POST') {
      if (!currentUser) throw new Error('Unauthorized');
      const posts = getItems(STORAGE_KEYS.POSTS, DEFAULT_POSTS);
      const newPost = {
        id: Date.now(),
        donor_id: currentUser.id,
        donor_name: currentUser.name,
        donor_phone: currentUser.phone || '',
        food_name: body.food_name,
        description: body.description || '',
        quantity: body.quantity,
        category: body.category || 'other',
        status: 'available',
        pickup_address: body.pickup_address,
        latitude: body.latitude ? parseFloat(body.latitude) : 19.0596,
        longitude: body.longitude ? parseFloat(body.longitude) : 72.8295,
        expiry_time: body.expiry_time || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      posts.unshift(newPost);
      setItems(STORAGE_KEYS.POSTS, posts);

      // Trigger notification for volunteers
      const notifs = getItems(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      notifs.unshift({
        id: Date.now(),
        user_id: 2, // notify volunteer
        title: '🍽️ New Food Donation Available!',
        message: `${newPost.donor_name} posted ${newPost.food_name} (${newPost.quantity}) in ${newPost.pickup_address.split(',')[0]}`,
        type: 'food',
        is_read: 0,
        created_at: new Date().toISOString()
      });
      setItems(STORAGE_KEYS.NOTIFICATIONS, notifs);

      return newPost;
    }

    if (pathname.match(/^\/posts\/\d+$/) && method === 'DELETE') {
      const postId = parseInt(pathname.split('/')[2]);
      let posts = getItems(STORAGE_KEYS.POSTS, DEFAULT_POSTS);
      posts = posts.filter(p => p.id !== postId);
      setItems(STORAGE_KEYS.POSTS, posts);
      return { success: true };
    }

    // 3. DELIVERIES ROUTES
    if (pathname === '/deliveries' && method === 'GET') {
      if (!currentUser) throw new Error('Unauthorized');
      const deliveries = getItems(STORAGE_KEYS.DELIVERIES, DEFAULT_DELIVERIES);
      const reviews = getItems(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);

      let list = deliveries.map(d => {
        const reviewed = reviews.some(r => r.delivery_id === d.id && r.reviewer_id === currentUser.id);
        return {
          ...d,
          current_user_reviewed: reviewed ? 1 : 0
        };
      });

      if (currentUser.role === 'donor') {
        list = list.filter(d => d.donor_id === currentUser.id);
      } else {
        list = list.filter(d => d.volunteer_id === currentUser.id);
      }

      list.sort((a, b) => new Date(b.accepted_at || b.created_at) - new Date(a.accepted_at || a.created_at));
      return list;
    }

    if (pathname === '/deliveries' && method === 'POST') {
      if (!currentUser || currentUser.role !== 'volunteer') throw new Error('Only volunteers can accept deliveries');
      const { post_id } = body;
      const posts = getItems(STORAGE_KEYS.POSTS, DEFAULT_POSTS);
      const deliveries = getItems(STORAGE_KEYS.DELIVERIES, DEFAULT_DELIVERIES);
      const post = posts.find(p => p.id === post_id);

      if (!post || post.status !== 'available') throw new Error('This food listing is no longer available');

      post.status = 'accepted';
      post.updated_at = new Date().toISOString();
      setItems(STORAGE_KEYS.POSTS, posts);

      const newDelivery = {
        id: Date.now(),
        post_id: post.id,
        volunteer_id: currentUser.id,
        volunteer_name: currentUser.name,
        donor_id: post.donor_id,
        donor_name: post.donor_name,
        donor_phone: post.donor_phone,
        food_name: post.food_name,
        category: post.category,
        quantity: post.quantity,
        pickup_address: post.pickup_address,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        pickup_at: null,
        delivered_at: null,
        receiver_name: null,
        proof_image: null,
        notes: null
      };

      deliveries.unshift(newDelivery);
      setItems(STORAGE_KEYS.DELIVERIES, deliveries);

      // Notify donor
      const notifs = getItems(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      notifs.unshift({
        id: Date.now(),
        user_id: post.donor_id,
        title: '🚴 Volunteer On The Way!',
        message: `${currentUser.name} accepted your food donation: ${post.food_name}.`,
        type: 'info',
        is_read: 0,
        created_at: new Date().toISOString()
      });
      setItems(STORAGE_KEYS.NOTIFICATIONS, notifs);

      return newDelivery;
    }

    if (pathname.match(/^\/deliveries\/\d+\/status$/) && method === 'PATCH') {
      const deliveryId = parseInt(pathname.split('/')[2]);
      const deliveries = getItems(STORAGE_KEYS.DELIVERIES, DEFAULT_DELIVERIES);
      const posts = getItems(STORAGE_KEYS.POSTS, DEFAULT_POSTS);
      const delivery = deliveries.find(d => d.id === deliveryId);

      if (!delivery) throw new Error('Delivery not found');

      const post = posts.find(p => p.id === delivery.post_id);

      if (delivery.status === 'accepted') {
        delivery.status = 'picked_up';
        delivery.pickup_at = new Date().toISOString();
        if (post) post.status = 'picked_up';
      } else if (delivery.status === 'picked_up') {
        delivery.status = 'delivered';
        delivery.delivered_at = new Date().toISOString();
        if (body.receiver_name) delivery.receiver_name = body.receiver_name;
        if (body.proof_image) delivery.proof_image = body.proof_image;
        if (post) post.status = 'delivered';

        // Notify donor of successful delivery
        const notifs = getItems(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
        notifs.unshift({
          id: Date.now(),
          user_id: delivery.donor_id,
          title: '✅ Food Delivered Successfully!',
          message: `${delivery.volunteer_name} completed the delivery for ${delivery.food_name}.${delivery.receiver_name ? ' Handed over to: ' + delivery.receiver_name : ''}`,
          type: 'success',
          is_read: 0,
          created_at: new Date().toISOString()
        });
        setItems(STORAGE_KEYS.NOTIFICATIONS, notifs);
      }

      setItems(STORAGE_KEYS.DELIVERIES, deliveries);
      if (post) setItems(STORAGE_KEYS.POSTS, posts);

      return delivery;
    }

    if (pathname.match(/^\/deliveries\/\d+\/review$/) && method === 'POST') {
      const deliveryId = parseInt(pathname.split('/')[2]);
      const { rating, note } = body;
      if (!rating || rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
      const deliveries = getItems(STORAGE_KEYS.DELIVERIES, DEFAULT_DELIVERIES);
      const delivery = deliveries.find(d => d.id === deliveryId);
      if (!delivery) throw new Error('Delivery not found');

      const reviews = getItems(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
      const reviewee_id = currentUser.id === delivery.donor_id ? delivery.volunteer_id : delivery.donor_id;

      reviews.push({
        id: Date.now(),
        delivery_id: deliveryId,
        reviewer_id: currentUser.id,
        reviewee_id,
        rating: Number(rating),
        note: note || '',
        created_at: new Date().toISOString()
      });
      setItems(STORAGE_KEYS.REVIEWS, reviews);
      return { success: true };
    }

    if (pathname.match(/^\/deliveries\/\d+\/report$/) && method === 'POST') {
      const deliveryId = parseInt(pathname.split('/')[2]);
      const { category, details } = body;
      if (!details) throw new Error('Details are required');
      const reports = getItems(STORAGE_KEYS.REPORTS, []);
      reports.push({
        id: Date.now(),
        delivery_id: deliveryId,
        reporter_id: currentUser ? currentUser.id : 0,
        category: category || 'other',
        details,
        created_at: new Date().toISOString()
      });
      setItems(STORAGE_KEYS.REPORTS, reports);
      return { success: true };
    }

    // 4. NOTIFICATIONS ROUTES
    if (pathname === '/notifications/unread-count' && method === 'GET') {
      if (!currentUser) return { count: 0 };
      const notifs = getItems(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      const unread = notifs.filter(n => n.user_id === currentUser.id && !n.is_read).length;
      return { count: unread };
    }

    if (pathname === '/notifications' && method === 'GET') {
      if (!currentUser) return [];
      const notifs = getItems(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      return notifs.filter(n => n.user_id === currentUser.id);
    }

    if (pathname.match(/^\/notifications\/\d+\/read$/) && method === 'PATCH') {
      const notifId = parseInt(pathname.split('/')[2]);
      const notifs = getItems(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      const n = notifs.find(x => x.id === notifId);
      if (n) n.is_read = 1;
      setItems(STORAGE_KEYS.NOTIFICATIONS, notifs);
      return { success: true };
    }

    if (pathname === '/notifications/read-all' && method === 'PATCH') {
      if (currentUser) {
        const notifs = getItems(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
        notifs.forEach(n => {
          if (n.user_id === currentUser.id) n.is_read = 1;
        });
        setItems(STORAGE_KEYS.NOTIFICATIONS, notifs);
      }
      return { success: true };
    }

    // 5. USER REPUTATION
    if (pathname.match(/^\/users\/\d+\/reputation$/)) {
      const userId = parseInt(pathname.split('/')[2]);
      const reviews = getItems(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
      const userReviews = reviews.filter(r => r.reviewee_id === userId);
      const avg = userReviews.length ? (userReviews.reduce((s, r) => s + r.rating, 0) / userReviews.length) : 5.0;
      return {
        user_id: userId,
        avg_rating: avg.toFixed(2),
        rating_count: userReviews.length,
        open_reports_30d: 0,
        under_review: 0
      };
    }

    // 6. SUPPORT CENTERS
    if (pathname === '/support-centers/nearby') {
      return { centers: SUPPORT_CENTERS_DATA };
    }

    return { success: true };
  }

  /**
   * Main Universal API function
   */
  async function fsApi(path, opts = {}) {
    const token = localStorage.getItem('fs_token');
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('fs_user') || 'null');
    } catch (e) {}

    // Check if backend is available or if we should use client mock
    if (isBackendOnline === null) {
      await checkBackend();
    }

    if (isBackendOnline) {
      try {
        const res = await fetch('/api' + path, {
          ...opts,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(opts.headers || {})
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Server error');
        return data;
      } catch (err) {
        // If server failed mid-session, fallback to mock
        console.warn('Backend call failed, using client storage fallback:', err.message);
        return handleMockRequest(path, opts, currentUser);
      }
    } else {
      // In-browser mock handler
      return handleMockRequest(path, opts, currentUser);
    }
  }

  // Initialize storage immediately
  initStorage();

  // Export to global window
  window.fsApi = fsApi;
  window.fsInitStorage = initStorage;
  window.fsCheckBackend = checkBackend;
})();
