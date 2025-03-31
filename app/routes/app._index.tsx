import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Page, Layout, Text, Card, Badge, InlineStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { Knob } from "../components/Knob/Knob";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(
      `
      query {
        shop {
          id
          metafield(namespace: "cart_transformation_app", key: "enabled") {
            id
            value
          }
        }
      }`,
    );
    const responseJson = await response.json();
    const id = responseJson.data?.shop?.id;
    const enabled = responseJson.data!.shop!.metafield!;

    return {
      enabled: enabled.value === "true",
      id: id,
    };
  } catch (error) {
    return { enabled: false, id: null }; // Return false if there's an error or if the metafield doesn't exist
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // need to pass id here somehow
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const enabled = formData.get("value");
  const shopId = formData.get("shopId");

  const response = await admin.graphql(
    `			
      mutation ToggleEnabled($value: String!, $id: ID!) {
              metafieldsSet(
                metafields: [
                  {
                    ownerId: $id, # Replace with actual shop GID
                    namespace: "cart_transformation_app",
                    key: "enabled",
                    type: "boolean",
                    value: $value
                  }
                ]
              ) {
                metafields {
                  id
                  key
                  value
                }
                userErrors {
                  field
                  message
                }
              }
        }`,
    {
      variables: {
        value: enabled,
        id: shopId,
      },
    },
  );

  const responseJson = await response.json();
  if (responseJson.data?.metafieldsSet?.userErrors) {
    return false;
  }

  return true;
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const data = useLoaderData<typeof loader>();
  const [shopId, setShopId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(data.enabled);

  useEffect(() => {
    setEnabled(data.enabled);
  }, [data.enabled]);

  useEffect(() => {
    setShopId(data.id);
  }, [data.id]);

  const handleChange = async (e: any) => {
    fetcher.submit({ value: e, shopId }, { method: "POST" });
  };

  return (
    <Page narrowWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <InlineStack align="space-between">
              <InlineStack align="start" gap="200" blockAlign="center">
                <Text as="p" variant="bodyMd">
                  Application
                  {enabled}
                </Text>
                <Badge tone={enabled ? "success" : "attention"}>
                  {enabled ? "Enabled" : "Disabled"}
                </Badge>
              </InlineStack>
              <Knob
                selected={enabled}
                ariaLabel="Example knob"
                onClick={() => handleChange(!enabled)}
              />
            </InlineStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
