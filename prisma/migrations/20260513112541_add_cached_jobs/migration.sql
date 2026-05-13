-- CreateTable
CREATE TABLE "CachedJob" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "seniority" TEXT NOT NULL,
    "skills" JSONB NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "internshipCountry" TEXT,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "postedAt" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CachedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobsFetchMeta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastFetched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobsFetchMeta_pkey" PRIMARY KEY ("id")
);
