import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { sessionCleared, sessionReceived } from "../features/auth/authSlice.js";
import { API_BASE_URL } from "./config.js";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithRefresh = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : args.url;
  if (result.error?.status === 401 && url !== "/auth/refresh") {
    const refreshed = await rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions);
    if (refreshed.data) {
      api.dispatch(sessionReceived(refreshed.data.data));
      result = await rawBaseQuery(args, api, extraOptions);
    } else api.dispatch(sessionCleared());
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithRefresh,
  tagTypes: ["Session", "Restaurant", "Menu", "Applications", "Addresses", "Cart", "PublicRestaurants", "Orders", "Reviews", "Favorites", "Admin", "Rider"],
  endpoints: (builder) => ({
    register: builder.mutation({ query: (body) => ({ url: "/auth/register", method: "POST", body }) }),
    login: builder.mutation({ query: (body) => ({ url: "/auth/login", method: "POST", body }) }),
    refresh: builder.mutation({ query: () => ({ url: "/auth/refresh", method: "POST" }) }),
    logout: builder.mutation({ query: () => ({ url: "/auth/logout", method: "POST" }) }),
    getMe: builder.query({ query: () => "/auth/me", providesTags: ["Session"] }),
    createRestaurant: builder.mutation({ query: (body) => ({ url: "/owner/restaurant", method: "POST", body }), invalidatesTags: ["Restaurant"] }),
    getOwnerRestaurant: builder.query({ query: () => "/owner/restaurant", providesTags: ["Restaurant"] }),
    updateRestaurant: builder.mutation({ query: (body) => ({ url: "/owner/restaurant", method: "PATCH", body }), invalidatesTags: ["Restaurant"] }),
    getOwnerMenu: builder.query({ query: () => "/owner/menu", providesTags: ["Menu"] }),
    createCategory: builder.mutation({ query: (body) => ({ url: "/owner/menu/categories", method: "POST", body }), invalidatesTags: ["Menu"] }),
    deleteCategory: builder.mutation({ query: (id) => ({ url: `/owner/menu/categories/${id}`, method: "DELETE" }), invalidatesTags: ["Menu"] }),
    createMenuItem: builder.mutation({ query: (body) => ({ url: "/owner/menu/items", method: "POST", body }), invalidatesTags: ["Menu"] }),
    updateMenuItem: builder.mutation({ query: ({ id, ...body }) => ({ url: `/owner/menu/items/${id}`, method: "PATCH", body }), invalidatesTags: ["Menu"] }),
    deleteMenuItem: builder.mutation({ query: (id) => ({ url: `/owner/menu/items/${id}`, method: "DELETE" }), invalidatesTags: ["Menu"] }),
    uploadImage: builder.mutation({ query: (file) => { const body = new FormData(); body.append("image", file); return { url: "/owner/uploads/images", method: "POST", body }; } }),
    getApplications: builder.query({ query: () => "/admin/restaurants", providesTags: ["Applications"] }),
    reviewRestaurant: builder.mutation({ query: ({ id, ...body }) => ({ url: `/admin/restaurants/${id}/status`, method: "PATCH", body }), invalidatesTags: ["Applications", "Restaurant"] }),
    getRestaurants: builder.query({ query: (params = {}) => ({ url: "/restaurants", params }), providesTags: ["PublicRestaurants"] }),
    getRestaurant: builder.query({ query: (id) => `/restaurants/${id}`, providesTags: (_result, _error, id) => [{ type: "PublicRestaurants", id }] }),
    getAddresses: builder.query({ query: () => "/addresses", providesTags: ["Addresses"] }),
    createAddress: builder.mutation({ query: (body) => ({ url: "/addresses", method: "POST", body }), invalidatesTags: ["Addresses"] }),
    updateAddress: builder.mutation({ query: ({ id, ...body }) => ({ url: `/addresses/${id}`, method: "PATCH", body }), invalidatesTags: ["Addresses"] }),
    deleteAddress: builder.mutation({ query: (id) => ({ url: `/addresses/${id}`, method: "DELETE" }), invalidatesTags: ["Addresses"] }),
    getCart: builder.query({ query: () => "/cart", providesTags: ["Cart"] }),
    addCartItem: builder.mutation({ query: (body) => ({ url: "/cart/items", method: "POST", body }), invalidatesTags: ["Cart"] }),
    updateCartItem: builder.mutation({ query: ({ id, quantity }) => ({ url: `/cart/items/${id}`, method: "PATCH", body: { quantity } }), invalidatesTags: ["Cart"] }),
    removeCartItem: builder.mutation({ query: (id) => ({ url: `/cart/items/${id}`, method: "DELETE" }), invalidatesTags: ["Cart"] }),
    clearCart: builder.mutation({ query: () => ({ url: "/cart", method: "DELETE" }), invalidatesTags: ["Cart"] }),
    checkout: builder.mutation({ query: (body) => ({ url: "/orders/checkout", method: "POST", body }), invalidatesTags: ["Cart", "Orders"] }),
    getOrders: builder.query({ query: () => "/orders", providesTags: ["Orders"] }),
    getOrder: builder.query({ query: (id) => `/orders/${id}`, providesTags: (_result, _error, id) => [{ type: "Orders", id }] }),
    cancelOrder: builder.mutation({ query: ({ id, reason }) => ({ url: `/orders/${id}/cancel`, method: "PATCH", body: { reason } }), invalidatesTags: ["Orders"] }),
    reorder: builder.mutation({ query: ({ id, replaceCart = false }) => ({ url: `/orders/${id}/reorder`, method: "POST", body: { replaceCart } }), invalidatesTags: ["Cart"] }),
    getOwnerOrders: builder.query({ query: () => "/owner/orders", providesTags: ["Orders"] }),
    updateOwnerOrder: builder.mutation({ query: ({ id, status, reason = "" }) => ({ url: `/owner/orders/${id}/status`, method: "PATCH", body: { status, reason } }), invalidatesTags: ["Orders"] }),
    createReview: builder.mutation({ query: (body) => ({ url: "/reviews", method: "POST", body }), invalidatesTags: ["Reviews", "PublicRestaurants", "Orders"] }),
    getRestaurantReviews: builder.query({ query: (id) => `/restaurants/${id}/reviews`, providesTags: ["Reviews"] }),
    getFavorites: builder.query({ query: () => "/favorites", providesTags: ["Favorites"] }),
    getRecentRestaurants: builder.query({ query: () => "/favorites/recent" }),
    toggleFavorite: builder.mutation({ query: (id) => ({ url: `/favorites/${id}`, method: "PATCH" }), invalidatesTags: ["Favorites"] }),
    getAdminUsers: builder.query({ query: () => "/admin/users", providesTags: ["Admin"] }),
    updateAdminUser: builder.mutation({ query: ({ id, status }) => ({ url: `/admin/users/${id}/status`, method: "PATCH", body: { status } }), invalidatesTags: ["Admin"] }),
    getAdminOrders: builder.query({ query: () => "/admin/orders", providesTags: ["Admin"] }),
    getAdminReviews: builder.query({ query: () => "/admin/reviews", providesTags: ["Admin"] }),
    moderateReview: builder.mutation({ query: ({ id, status }) => ({ url: `/admin/reviews/${id}`, method: "PATCH", body: { status } }), invalidatesTags: ["Admin", "Reviews"] }),
    operateRestaurant: builder.mutation({ query: ({ id, status }) => ({ url: `/admin/restaurants/${id}/operation`, method: "PATCH", body: { status } }), invalidatesTags: ["Applications", "Admin"] }),
    getAdminAudit: builder.query({ query: () => "/admin/audit", providesTags: ["Admin"] }),
    forgotPassword: builder.mutation({ query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }) }),
    resetPassword: builder.mutation({ query: (body) => ({ url: "/auth/reset-password", method: "POST", body }) }),
    getRiderDashboard: builder.query({ query: () => "/riders/dashboard", providesTags: ["Rider"] }),
    applyAsRider: builder.mutation({ query: (body) => ({ url: "/riders/apply", method: "POST", body }), invalidatesTags: ["Rider"] }),
    updateRiderAvailability: builder.mutation({ query: (body) => ({ url: "/riders/availability", method: "PATCH", body }), invalidatesTags: ["Rider"] }),
    submitRestaurantLead: builder.mutation({ query: (body) => ({ url: "/riders/restaurant-leads", method: "POST", body }), invalidatesTags: ["Rider"] }),
    acceptDelivery: builder.mutation({ query: (id) => ({ url: `/riders/deliveries/${id}/accept`, method: "POST" }), invalidatesTags: ["Rider", "Orders"] }),
    updateRiderDelivery: builder.mutation({ query: ({ id, status }) => ({ url: `/riders/deliveries/${id}/status`, method: "PATCH", body: { status } }), invalidatesTags: ["Rider", "Orders"] }),
    getAdminRiders: builder.query({ query: () => "/admin/riders", providesTags: ["Rider"] }),
    reviewRider: builder.mutation({ query: ({ id, ...body }) => ({ url: `/admin/riders/${id}`, method: "PATCH", body }), invalidatesTags: ["Rider", "Admin"] }),
    reviewRestaurantLead: builder.mutation({ query: ({ id, ...body }) => ({ url: `/admin/restaurant-leads/${id}`, method: "PATCH", body }), invalidatesTags: ["Rider", "Admin"] }),
    markRiderEarningPaid: builder.mutation({ query: (id) => ({ url: `/admin/rider-earnings/${id}`, method: "PATCH", body: { status: "paid" } }), invalidatesTags: ["Rider", "Admin"] }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useRefreshMutation, useLogoutMutation, useGetMeQuery, useCreateRestaurantMutation, useGetOwnerRestaurantQuery, useUpdateRestaurantMutation, useGetOwnerMenuQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useCreateMenuItemMutation, useUpdateMenuItemMutation, useDeleteMenuItemMutation, useUploadImageMutation, useGetApplicationsQuery, useReviewRestaurantMutation, useGetRestaurantsQuery, useGetRestaurantQuery, useGetAddressesQuery, useCreateAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation, useGetCartQuery, useAddCartItemMutation, useUpdateCartItemMutation, useRemoveCartItemMutation, useClearCartMutation, useCheckoutMutation, useGetOrdersQuery, useGetOrderQuery, useCancelOrderMutation, useReorderMutation, useGetOwnerOrdersQuery, useUpdateOwnerOrderMutation, useCreateReviewMutation, useGetRestaurantReviewsQuery, useGetFavoritesQuery, useGetRecentRestaurantsQuery, useToggleFavoriteMutation, useGetAdminUsersQuery, useUpdateAdminUserMutation, useGetAdminOrdersQuery, useGetAdminReviewsQuery, useModerateReviewMutation, useOperateRestaurantMutation, useGetAdminAuditQuery, useForgotPasswordMutation, useResetPasswordMutation, useGetRiderDashboardQuery, useApplyAsRiderMutation, useUpdateRiderAvailabilityMutation, useSubmitRestaurantLeadMutation, useAcceptDeliveryMutation, useUpdateRiderDeliveryMutation, useGetAdminRidersQuery, useReviewRiderMutation, useReviewRestaurantLeadMutation, useMarkRiderEarningPaidMutation } = api;
