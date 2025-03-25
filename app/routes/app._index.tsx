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
          metafield(namespace: "cart_transformation_app", key: "enabled") {
            id
            value
          }
        }
      }`,
    );
    const responseJson = await response.json();
    const enabled = responseJson.data!.shop!.metafield!;

    return {
      enabled: enabled.value === "true",
    };
  } catch (error) {
    return { enabled: false };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const enabled = formData.get("value");

  const response = await admin.graphql(
    `			
      mutation ToggleEnabled($value: String!) {
              metafieldsSet(
                metafields: [
                  {
                    ownerId: "gid://shopify/Shop/93190947129", # Replace with actual shop GID
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
  const [enabled, setEnabled] = useState(data.enabled);

  useEffect(() => {
    setEnabled(data.enabled);
  }, [data.enabled]);

  // Need to set up error handling somehow, if for some reason toggle doesnt work
  // Dont update settings, throw popup error using useAppBridge()

  const handleChange = async (e: any) => {
    // setEnabled(e);
    fetcher.submit({ value: e }, { method: "POST" });
    // if (!res) setEnabled(!e);
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
