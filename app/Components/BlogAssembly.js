import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getHomeLayout } from "@/app/lib/getHomeLayout";
import CategoryBlogs from "./CategoryBlogs";
import DeepDiveSlider from "./DeepDiveSlider";
import HomeInfiniteFeed from "./HomeInfiniteFeed";
import AboutUs from "./AboutUs";
import HeroSectionBlogs from "./HeroSectionBlogs";
import TrendingBlogs from "./TrendingBlogs";
import EditorsPicks from "./EditorsPicks";



export default async function BlogAssembly() {
  try {
    const layoutData = await getHomeLayout();

    if (!layoutData) {
      console.warn("No home layout data returned.");
      return (
        <section className="max-w-[1360px] mx-auto px-4 md:px-8 w-full my-12 bg-[var(--color-background)]">
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface)] rounded-[24px] border border-[var(--color-border)] shadow-[0_4px_24px_rgba(3,4,10,0.4)] text-center">
            <div className="w-16 h-16 bg-[var(--color-surface-alt)] rounded-full flex items-center justify-center mb-4 border border-[var(--color-border)]">
              <span className="text-[24px]">📝</span>
            </div>

            <h3 className="font-sans text-[28px] font-extrabold text-[var(--color-text-primary)] mb-2 tracking-tight">
              No Insights Available Yet
            </h3>

            <p className="text-[var(--color-text-secondary)] font-sans font-medium max-w-md">
              Our editorial team is working on new shopping guides and deals.
              Please check back soon.
            </p>
          </div>
        </section>
      );
    }

    return (
      <div className="flex flex-col gap-0 bg-[var(--color-background)]">
        {layoutData.deepDives.length > 0 && (
          <DeepDiveSlider posts={layoutData.deepDives} />
        )}
                    <HeroSectionBlogs
          heroFeatured={layoutData.heroFeatured}
          heroGrid={layoutData.heroGrid}
        />
               {layoutData.editorsPicks && layoutData.editorsPicks.length > 0 && (
          <EditorsPicks posts={layoutData.editorsPicks} />
        )}
    
 {/*      {layoutData.trending && layoutData.trending.length > 0 && (
          <TrendingBlogs posts={layoutData.trending} />
        )}  */}

  

        <AboutUs />
{/* 
        <CategoryBlogs layoutData={layoutData} /> */}

      {/*   {layoutData.initialFeed.length > 0 && (
          <div className="max-w-[1360px] mx-auto px-4 md:px-8 w-full py-16">
            <HomeInfiniteFeed
              initialPosts={layoutData.initialFeed}
              initialOffset={layoutData.nextOffset}
            />
          </div>
        )} */}
      </div>
    );
  } catch (error) {
    console.error("Blog Assembly Error:", error);

    return (
      <div className="text-center py-20 text-[var(--color-text-secondary)] font-sans font-medium bg-[var(--color-surface)] rounded-[16px] m-4 border border-[var(--color-border)] shadow-sm">
        Unable to load the latest articles at this moment.
      </div>
    );
  }
}