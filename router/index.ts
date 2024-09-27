import { createRouter, createWebHistory } from 'vue-router';
export const Paths = {
	Home: "/",
	Auth: {
		Login: "/auth/callback"
	}
};

const routes = [
	{
		path: '/auth/callback',
		beforeEnter: (to, from, next) => {
			const hash = to.hash;
			if (hash) {
				const token = new URLSearchParams(hash.substring(1)).get('access_token');
				if (token) {
					// Lưu token vào localStorage hoặc state của bạn
					localStorage.setItem('dropbox_access_token', token);
					// Chuyển hướng đến trang chính của ứng dụng
					next('/'); // Hoặc đường dẫn nào khác mà bạn muốn
					return;
				}
			}
			next(); // Nếu không có token, chuyển đến route khác
		},
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});
export default router;
declare module 'vue-router' {
	interface RouteMeta {
		authRequired?: boolean
		disallowAuthorized?: boolean
	}
}