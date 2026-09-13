import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Campaign, ApplicationWithCreator, Application, Submission } from "@collabify/shared";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Campaign", "Application", "Submission"],
  endpoints: (builder) => ({
    listCampaigns: builder.query<Campaign[], { status?: string } | void>({
      query: (params) => ({ url: "/campaigns", params: params ?? undefined }),
      providesTags: ["Campaign"],
    }),
    listMyCampaigns: builder.query<Campaign[], void>({
      query: () => "/campaigns/mine",
      providesTags: ["Campaign"],
    }),
    getCampaign: builder.query<Campaign, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: ["Campaign"],
    }),
    createCampaign: builder.mutation<Campaign, { title: string; description: string; budgetCents: number; status?: string }>({
      query: (body) => ({ url: "/campaigns", method: "POST", body }),
      invalidatesTags: ["Campaign"],
    }),
    listApplications: builder.query<ApplicationWithCreator[], string>({
      query: (campaignId) => `/applications/campaign/${campaignId}`,
      providesTags: ["Application"],
    }),
    applyToCampaign: builder.mutation<Application, { campaignId: string; pitch: string }>({
      query: (body) => ({ url: "/applications", method: "POST", body }),
      invalidatesTags: ["Application"],
    }),
    getMyApplication: builder.query<Application | null, string>({
      query: (campaignId) => `/applications/campaign/${campaignId}/mine`,
      providesTags: ["Application"],
    }),
    updateApplicationStatus: builder.mutation<Application, { id: string; status: "accepted" | "rejected" }>({
      query: ({ id, status }) => ({ url: `/applications/${id}/status`, method: "PATCH", body: { status } }),
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
  useListMyCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useListApplicationsQuery,
  useApplyToCampaignMutation,
  useGetMyApplicationQuery,
  useUpdateApplicationStatusMutation,
  useUploadSubmissionMutation,
} = api;