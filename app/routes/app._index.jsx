import { useCallback, useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Text,
  IndexTable,
  LegacyCard,
  ResourceItem,
  ResourceList,
  Thumbnail,
  Button,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
    query QueryRoot($first: Int) {
     products(first: $first) {
    nodes {
      id
      handle
      featuredImage {
        url
      }
      images(first:1) {
        nodes {
          url
        }
      }
      productType
      title
      totalInventory
      vendor
      
      variants(first: 10) {
      nodes{
        image {
          url
        }
       
        title
        availableForSale
        price
        title
        id
      }
      }
      
    }
  }
}
 `,
    {
      variables: {
        first: 30
      },
    }
  );
  const responseJson = await response.json();
  return json({ productsData: responseJson.data.products.nodes });
};

export default function IndexFiltersDefault() {
  const { productsData } = useLoaderData();
  const PRODUCT_PLACEHOLDER_IMAGE = 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png?format=webp&v=1530129292'
  const rowMarkup = productsData.map(
    (
      { id, featuredImage, title, totalInventory, vendor, variants },
      index
    ) => {
      return <IndexTable.Row
        id={id}
        key={id}
        position={index}
      >
        <IndexTable.Cell>
          <img
            src={featuredImage?.url || PRODUCT_PLACEHOLDER_IMAGE}
            alt={"product thumbnail" + title}

            width={100}
            height={100}
          />
        </IndexTable.Cell>
        <IndexTable.Cell> <Text fontWeight="bold" as="span">{title}</Text></IndexTable.Cell>
        <IndexTable.Cell>{totalInventory}</IndexTable.Cell>
        <IndexTable.Cell>{vendor}</IndexTable.Cell>
        <IndexTable.Cell>
          <ResourceList
            resourceName={{ singular: 'customer', plural: 'customers' }}
            items={variants.nodes}
            renderItem={(item) => {
              const { id, title, image } = item;
              const variantId = id.slice(id.lastIndexOf('/') + 1)
              const media = <Thumbnail source={image?.url || PRODUCT_PLACEHOLDER_IMAGE} alt={title} />;
              return (
                <ResourceItem
                  id={id}
                  media={media}
                  url={`/app/variant/${variantId}`}
                  accessibilityLabel={`View details for ${title}`}
                >
                  <Text variant="bodyMd" fontWeight="bold" as="h3">
                    {title}
                  </Text>
                  <Button primary>View</Button>
                </ResourceItem>
              );
            }}
          />
        </IndexTable.Cell>
      </IndexTable.Row>
    }
  );
  const resourceName = {
    singular: "product",
    plural: "products",
  };

  return (
    <Page
      title={"Products"}
    >
      <LegacyCard>
        <IndexTable
          resourceName={resourceName}
          itemCount={productsData.length}
          selectable={false}
          headings={[
            { title: "Image" },
            { title: "Title" },
            { title: "Inventory" },
            { title: "Vendor" },
            { title: "Variants" },
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </LegacyCard>
    </Page>
  )
}