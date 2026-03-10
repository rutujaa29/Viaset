-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeadCategory" AS ENUM ('SERVICE', 'PRODUCT', 'CAPABILITY');

-- CreateEnum
CREATE TYPE "CompanyCategory" AS ENUM ('SUPPLIER', 'BUYER', 'BOTH');

-- CreateEnum
CREATE TYPE "GeographicReach" AS ENUM ('LOCAL', 'NATIONAL', 'GLOBAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'COMPANY_USER',
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subscription_plan" "SubscriptionPlan" NOT NULL DEFAULT 'BASIC',
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "searches_used_this_month" INTEGER NOT NULL DEFAULT 0,
    "search_limit_month" INTEGER,
    "reset_usage_on" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "industry_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "LeadCategory" NOT NULL DEFAULT 'SERVICE',
    "slug" TEXT NOT NULL,

    CONSTRAINT "lead_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_type_industries" (
    "lead_type_id" TEXT NOT NULL,
    "industry_segment_id" TEXT NOT NULL,

    CONSTRAINT "lead_type_industries_pkey" PRIMARY KEY ("lead_type_id","industry_segment_id")
);

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "category" "CompanyCategory" NOT NULL DEFAULT 'BOTH',
    "sub_category" TEXT,
    "services_offered" TEXT[],
    "industries_served" TEXT[],
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "certifications" TEXT,
    "notes" TEXT,
    "company_size" TEXT,
    "year_established" INTEGER,
    "min_order_quantity" TEXT,
    "export_capability" BOOLEAN NOT NULL DEFAULT false,
    "geographic_reach" "GeographicReach",
    "key_capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "data_completeness" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_verified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profile_industries" (
    "company_profile_id" TEXT NOT NULL,
    "industry_segment_id" TEXT NOT NULL,

    CONSTRAINT "company_profile_industries_pkey" PRIMARY KEY ("company_profile_id","industry_segment_id")
);

-- CreateTable
CREATE TABLE "company_lead_suppliers" (
    "company_profile_id" TEXT NOT NULL,
    "lead_type_id" TEXT NOT NULL,

    CONSTRAINT "company_lead_suppliers_pkey" PRIMARY KEY ("company_profile_id","lead_type_id")
);

-- CreateTable
CREATE TABLE "company_lead_buyers" (
    "company_profile_id" TEXT NOT NULL,
    "lead_type_id" TEXT NOT NULL,

    CONSTRAINT "company_lead_buyers_pkey" PRIMARY KEY ("company_profile_id","lead_type_id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_usage" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_profile_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_comparisons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_profile_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyProfileId" TEXT,

    CONSTRAINT "company_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "record_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_category_requests" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_category_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "companies_subscription_plan_idx" ON "companies"("subscription_plan");

-- CreateIndex
CREATE UNIQUE INDEX "industry_segments_name_key" ON "industry_segments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lead_types_name_key" ON "lead_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lead_types_slug_key" ON "lead_types"("slug");

-- CreateIndex
CREATE INDEX "lead_types_category_idx" ON "lead_types"("category");

-- CreateIndex
CREATE INDEX "company_profiles_category_idx" ON "company_profiles"("category");

-- CreateIndex
CREATE INDEX "company_profiles_sub_category_idx" ON "company_profiles"("sub_category");

-- CreateIndex
CREATE INDEX "company_profiles_company_name_idx" ON "company_profiles"("company_name");

-- CreateIndex
CREATE INDEX "company_profiles_country_idx" ON "company_profiles"("country");

-- CreateIndex
CREATE INDEX "company_profiles_is_active_idx" ON "company_profiles"("is_active");

-- CreateIndex
CREATE INDEX "company_profiles_data_completeness_idx" ON "company_profiles"("data_completeness");

-- CreateIndex
CREATE INDEX "saved_searches_company_id_idx" ON "saved_searches"("company_id");

-- CreateIndex
CREATE INDEX "search_usage_company_id_idx" ON "search_usage"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "search_usage_company_id_year_month_key" ON "search_usage"("company_id", "year", "month");

-- CreateIndex
CREATE INDEX "bookmarks_user_id_idx" ON "bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_company_profile_id_key" ON "bookmarks"("user_id", "company_profile_id");

-- CreateIndex
CREATE INDEX "company_notes_user_id_idx" ON "company_notes"("user_id");

-- CreateIndex
CREATE INDEX "company_notes_company_profile_id_idx" ON "company_notes"("company_profile_id");

-- CreateIndex
CREATE INDEX "company_comparisons_user_id_idx" ON "company_comparisons"("user_id");

-- CreateIndex
CREATE INDEX "search_history_user_id_idx" ON "search_history"("user_id");

-- CreateIndex
CREATE INDEX "search_history_company_id_idx" ON "search_history"("company_id");

-- CreateIndex
CREATE INDEX "search_history_created_at_idx" ON "search_history"("created_at");

-- CreateIndex
CREATE INDEX "export_history_user_id_idx" ON "export_history"("user_id");

-- CreateIndex
CREATE INDEX "export_history_company_id_idx" ON "export_history"("company_id");

-- CreateIndex
CREATE INDEX "custom_category_requests_company_id_idx" ON "custom_category_requests"("company_id");

-- CreateIndex
CREATE INDEX "custom_category_requests_status_idx" ON "custom_category_requests"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_type_industries" ADD CONSTRAINT "lead_type_industries_lead_type_id_fkey" FOREIGN KEY ("lead_type_id") REFERENCES "lead_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_type_industries" ADD CONSTRAINT "lead_type_industries_industry_segment_id_fkey" FOREIGN KEY ("industry_segment_id") REFERENCES "industry_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profile_industries" ADD CONSTRAINT "company_profile_industries_company_profile_id_fkey" FOREIGN KEY ("company_profile_id") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profile_industries" ADD CONSTRAINT "company_profile_industries_industry_segment_id_fkey" FOREIGN KEY ("industry_segment_id") REFERENCES "industry_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_lead_suppliers" ADD CONSTRAINT "company_lead_suppliers_company_profile_id_fkey" FOREIGN KEY ("company_profile_id") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_lead_suppliers" ADD CONSTRAINT "company_lead_suppliers_lead_type_id_fkey" FOREIGN KEY ("lead_type_id") REFERENCES "lead_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_lead_buyers" ADD CONSTRAINT "company_lead_buyers_company_profile_id_fkey" FOREIGN KEY ("company_profile_id") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_lead_buyers" ADD CONSTRAINT "company_lead_buyers_lead_type_id_fkey" FOREIGN KEY ("lead_type_id") REFERENCES "lead_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_usage" ADD CONSTRAINT "search_usage_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_usage" ADD CONSTRAINT "search_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_company_profile_id_fkey" FOREIGN KEY ("company_profile_id") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_notes" ADD CONSTRAINT "company_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_notes" ADD CONSTRAINT "company_notes_company_profile_id_fkey" FOREIGN KEY ("company_profile_id") REFERENCES "company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_comparisons" ADD CONSTRAINT "company_comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_comparisons" ADD CONSTRAINT "company_comparisons_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "company_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_category_requests" ADD CONSTRAINT "custom_category_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_category_requests" ADD CONSTRAINT "custom_category_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
