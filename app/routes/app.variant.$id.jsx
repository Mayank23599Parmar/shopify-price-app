import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {  Badge, Box, Button, Card,  Grid, HorizontalGrid, Page,  Text, TextField, VerticalStack } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { useCallback, useEffect, useState } from "react";
// This example is for guidance purposes. Copying it will come with caveats.
export async function loader({ params, request }) {
  const { id } = params;
  const productVariantId = `gid://shopify/ProductVariant/${id}`
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(
    `#graphql
   query ProductVariant($nodeId: ID!) {
  node(id: $nodeId) {
    ... on ProductVariant {
        image {
          url
        }
       
        title
        availableForSale
        price
        id
        product {
        id
        title
      }
      }
  }
}
    `,
    {
      variables: {
        nodeId: productVariantId
      },
    }
  );
  const responseJson = await response.json();
  return json({
    variantData: responseJson.data.node,
    lastVariantPrice:0
  });
}
export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const body = await request.formData();
  const id = body.get('id')
  const price = body.get('price');
  const product = body.get('product')
  console.log(JSON.parse(product),'=========>dqdqdqmdodjqj1')
  const response = await admin.graphql(
    `#graphql
    mutation productVariantUpdate($input: ProductVariantInput!) {
  productVariantUpdate(input: $input) {
   
    productVariant {
      image {
          url
        }
       
        title
        availableForSale
        price
        id

      # ProductVariant fields
    }
    userErrors {
      field
      message
    }
  }
}
    `,
    {
      variables: {
        input: {
          id: id,
          price: price

        },
      },
    }
  );

  const responseJson = await response.json();
  return json({ productVariantUpdate: responseJson.data.productVariantUpdate.productVariant,lastVariantPrice:0 });
}
export default function ResourceDetailsLayout() {
  const { variantData ,lastVariantPrice} = useLoaderData()
  const nav = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();

  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST"
  const { title, availableForSale, price, image, id, product } = variantData;
  const [variantPrice, setVariantPrice] = useState(price);
  const productVariantUpdatedId = actionData?.productVariantUpdate?.id
  useEffect(() => {
    if (productVariantUpdatedId) {
      shopify.toast.show("Variant Price change");
    }
  }, [productVariantUpdatedId])


  const generateProduct = () => submit({ id: id, price: variantPrice, product:JSON.stringify(product) }, { replace: true, method: "POST" });
  const handleChange = useCallback((newValue) => setVariantPrice(newValue),
    [],
  );

  const PRODUCT_PLACEHOLDER_IMAGE = 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png?format=webp&v=1530129292'
  const SkeletonLabel = (props) => {
    return (
      <Box
        background="bg-strong"
        minHeight="1rem"
        maxWidth="5rem"
        borderRadius="base"
        {...props}
      />
    );
  };
  return (
    <Page
      backAction={{ content: title, url: "/app" }}
      title={title}
    >
      <HorizontalGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="4">
        <VerticalStack gap="4">
          <Card roundedAbove="sm">

            <VerticalStack gap="4">
              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <img src={image?.url || PRODUCT_PLACEHOLDER_IMAGE} alt={title} width={250} />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                  <Text variant="heading4xl" as="h1"> {title}
                  </Text>
                  <Box minHeight="2rem" />
                  <Text as="p" fontWeight="bold">
                    available :  {availableForSale ? <Badge status="success">In Stock</Badge> : <Badge status="warning">Out of stock</Badge>}
                  </Text>
                  <Box minHeight="2rem" />
                  <Text as="p" fontWeight="bold">
                  Previous Price : {lastVariantPrice == 0 ? 'Not Change' : lastVariantPrice}
                  </Text>
                  
                </Grid.Cell>
              </Grid>
              <Box minHeight="2rem" />
              <TextField
                label="Current Price"
                value={variantPrice}
                onChange={handleChange}
                autoComplete="off"
              />
              <Button loading={isLoading} primary onClick={generateProduct}>Change Price</Button>
            </VerticalStack>
          </Card>
        </VerticalStack>
      </HorizontalGrid>
    </Page>
  )
}