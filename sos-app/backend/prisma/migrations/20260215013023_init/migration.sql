-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "dirVillageSignature" TEXT,
ADD COLUMN     "dirVillageValidatedAt" TIMESTAMP(3),
ADD COLUMN     "dirVillageValidatedById" TEXT,
ADD COLUMN     "sauvegardeSignature" TEXT,
ADD COLUMN     "sauvegardeValidatedAt" TIMESTAMP(3),
ADD COLUMN     "sauvegardeValidatedById" TEXT;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_dirVillageValidatedById_fkey" FOREIGN KEY ("dirVillageValidatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_sauvegardeValidatedById_fkey" FOREIGN KEY ("sauvegardeValidatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
