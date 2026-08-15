import { notFound } from "next/navigation";
import { connectDB } from "@/app/lib/mongodb";
import Store from "@/app/models/store";
import Coupon from "@/app/models/coupon";
import "@/app/models/category";
import { unstable_cache } from "next/cache";
import SingleStoreClient from "@/app/Components/SingleStoreClient";


const SIMILAR_STORES_LIMIT = 4;

const STORE_SELECT = [
  "name",
  "slug",
  "officialUrl",
  "countryCode",
  "primaryCategoryId",
  "isFeatured",
  "content",
  "policy",
  "facts",
  "images",
  "seo",
  "faqs",
].join(" ");

const COUPON_SELECT = [
  "title",
  "subtitle",
  "terms",
  "trackingLink",
  "type",
  "codeType",
  "code",
  "discountType",
  "discountValue",
  "maxDiscountCap",
  "minOrderValue",
  "expiryDate",
  "isVerified",
  "verifiedAt",
  "isExclusive",
  "isPinned",
  "sortOrder",
].join(" ");

const SIMILAR_STORES_SELECT = [
  "name",
  "slug",
  "images.logo",
  "isFeatured",
  "content.shortDescription",
].join(" ");

function buildCountryFilter(countryCode) {
  if (!countryCode || countryCode === "GLOBAL") return {};
  return { countryCode: { $in: [countryCode, "GLOBAL"] } };
}

// ─── Tag-Cached Data Fetcher ──────────────────────────────────────────────────
const getCachedStoreData = (slug) =>
  unstable_cache(
    async () => {
      await connectDB();

      const store = await Store.findOne({ slug, isActive: true })
        .populate("primaryCategoryId", "name slug")
        .select(STORE_SELECT)
        .lean();

      if (!store) return null;

      const countryFilter = buildCountryFilter(store.countryCode);

      const couponQuery = {
        storeId: store._id,
        status: "active",
        ...countryFilter,
      };

      const similarStoresQuery = {
        primaryCategoryId: store.primaryCategoryId?._id,
        _id: { $ne: store._id },
        isActive: true,
        ...countryFilter,
      };

      const [couponsList, similarStores] = await Promise.all([
        Coupon.find(couponQuery)
          .select(COUPON_SELECT)
          .sort(Coupon.defaultSort())
          .lean(),

        Store.find(similarStoresQuery)
          .select(SIMILAR_STORES_SELECT)
          .sort({ isFeatured: -1, createdAt: -1 })
          .limit(SIMILAR_STORES_LIMIT)
          .lean(),
      ]);

      // Safely structure exactly like your API does
      const structuredData = {
        store,
        coupons: {
          total: couponsList.length,
          items: couponsList,
        },
        similarStores,
      };

      // Serialize MongoDB Documents safely to plain JSON for Client Components
      return JSON.parse(JSON.stringify(structuredData));
    },
    [`store-detail-page-${slug}`],
    {
      tags: ["stores", `store-${slug}`],
      revalidate: 300,
    }
  )();

export default async function Page({ params }) {
  const { slug } = await params;
  const data = await getCachedStoreData(slug);

  if (!data) {
    notFound();
  }

  return <SingleStoreClient initialData={data} slug={slug} />;
}