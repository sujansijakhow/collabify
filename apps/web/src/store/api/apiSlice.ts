import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Campaign, Application, Submission } from "@collabify/shared";

// RTK Query talks to the Elysia REST layer. Real-time updates (chat,
// submission status) arrive separately over Socket.io and are merged into
// the cache via `api.util.updateQueryData` from the socket event handlers.
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Campaign", "Application", "Submission"],
  endpoints: (builder) => ({
    listCampaigns: builder.query<Campaign[], { status?: string } | void>({
      query: (params) => ({ url: "/campaigns", params: params ?? undefined }),
      providesTags: ["Campaign"],
    }),
    getCampaign: builder.query<Campaign, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: ["Campaign"],
    }),
    createCampaign: builder.mutation<Campaign, Partial<Campaign>>({
      query: (body) => ({ url: "/campaigns", method: "POST", body }),
      invalidatesTags: ["Campaign"],
    }),
    listApplications: builder.query<Application[], string>({
      query: (campaignId) => `/applications/campaign/${campaignId}`,
      providesTags: ["Application"],
    }),
    applyToCampaign: builder.mutation<Application, { campaignId: string; creatorId: string; pitch: string }>({
      query: (body) => ({ url: "/applications", method: "POST", body }),
      invalidatesTags: ["Application"],
    }),
    uploadSubmission: builder.mutation<Submission, FormData>({
      query: (formData) => ({ url: "/submissions", method: "POST", body: formData }),
      invalidatesTags: ["Submission"],
    }),
  }),
});

export const {
  useListCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useListApplicationsQuery,
  useApplyToCampaignMutation,
  useUploadSubmissionMutation,
} = api;
