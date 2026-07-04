export const endpoints = {
  auth: {
    login: '/auth',
    logout: '/auth/token',
    refresh: '/auth/refresh',
  },
  users: {
    register: '/users',
    checkEmail: (email) => `/users/email?email=${encodeURIComponent(email)}`,
    checkNickname: (nickname) => `/users/nickname?nickname=${encodeURIComponent(nickname)}`,
    detail: (userId) => `/users/${userId}`,
    update: (userId) => `/users/${userId}`,
    updatePassword: '/users/password',
    deactivate: (userId) => `/users/${userId}/deactivation`,
  },
  posts: {
    list: ({ cursor, size = 10, period, nickname } = {}) => {
      const params = new URLSearchParams();
      params.set('size', String(size));
      if (cursor) params.set('cursor', String(cursor));
      if (period) params.set('period', period);
      if (nickname) params.set('nickname', nickname);
      return `/posts?${params.toString()}`;
    },
    index: '/posts/index',
    top10: '/posts/top10',
    create: '/posts',
    detail: (postId) => `/posts/${postId}`,
    update: (postId) => `/posts/${postId}`,
    deactivate: (postId) => `/posts/${postId}/deactivation`,
    statuses: (postId) => `/posts/${postId}/statuses`,
    like: (postId) => `/posts/${postId}/likes`,
    typeCount: (type) => `/posts/type?type=${encodeURIComponent(type)}`,
  },
  comments: {
    list: (postId, { page = 0, size = 100 } = {}) => `/posts/${postId}/comments?page=${page}&size=${size}`,
    create: (postId) => `/posts/${postId}/comments`,
    update: (commentId) => `/comments/${commentId}`,
    deactivate: (commentId) => `/comments/${commentId}/deactivation`,
  },
  courses: {
    list: '/courses',
    subscriptions: '/courses/subscriptions',
    subscribe: (courseId) => `/courses/${courseId}/subscription`,
    report: (courseId) => `/courses/${courseId}/reports`,
  },
  notifications: {
    unreadCount: '/me/notifications/unread-count',
    list: ({ cursor, size = 20 } = {}) => {
      const params = new URLSearchParams();
      params.set('size', String(size));
      if (cursor) params.set('cursor', String(cursor));
      return `/me/notifications?${params.toString()}`;
    },
    markRead: (notificationId) => `/me/notifications/${notificationId}/read`,
  },
  admin: {
    reports: {
      list: ({ status, cursor, size = 20 } = {}) => {
        const params = new URLSearchParams({ size: String(size) });
        if (status) params.set('status', status);
        if (cursor) params.set('cursor', String(cursor));
        return `/admin/course-reports?${params.toString()}`;
      },
      update: (reportId) => `/admin/course-reports/${reportId}`,
      delete: (reportId) => `/admin/course-reports/${reportId}`,
    },
  },
};
