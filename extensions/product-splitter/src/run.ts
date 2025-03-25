import type {
  RunInput,
  FunctionRunResult,
  CartLine,
  CartOperation,
} from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

export function run(input: RunInput): FunctionRunResult {
  try {
    const enabled = input?.shop?.appEnabled?.value === "true";
    if (!enabled) {
      return NO_CHANGES;
    }

    const itemsGroup: Record<
      CartLine["id"],
      { cartLineComponents: Record<string, number> }
    > = {};

    input.cart.lines.forEach((line) => {
      const productComponents = line.merchandise?.product?.metafield?.value;

      if (productComponents) {
        const components = JSON.parse(productComponents);

        const cartLineId = line.id;

        if (!itemsGroup[cartLineId]) {
          itemsGroup[cartLineId] = {
            cartLineComponents: {},
          };
        }

        components.forEach((component: any) => {
          const [componentId, componentQuantity] = component.split(" ");
          itemsGroup[cartLineId].cartLineComponents[componentId] =
            Number(componentQuantity);
        });
      }
    });

    return {
      operations: [
        ...Object.entries(itemsGroup).map(
          ([cartLineId, { cartLineComponents }]) => {
            const expendOperation: CartOperation = {
              expand: {
                cartLineId: cartLineId,
                expandedCartItems: Object.entries(cartLineComponents).map(
                  ([componentId, componentQuantity]) => {
                    return {
                      merchandiseId: componentId,
                      quantity: componentQuantity,
                    };
                  },
                ),
              },
            };

            return expendOperation;
          },
        ),
      ],
    };
  } catch (error) {
    return NO_CHANGES;
  }
}
