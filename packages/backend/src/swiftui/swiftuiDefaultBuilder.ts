import { numberToFixedString } from "./../common/numToAutoFixed";
import { swiftuiBlur, swiftuiShadow } from "./builderImpl/swiftuiEffects";
import {
  swiftuiBorder,
  swiftuiCornerRadius,
} from "./builderImpl/swiftuiBorder";
import { swiftuiPadding } from "./builderImpl/swiftuiPadding";
import { swiftuiSize } from "./builderImpl/swiftuiSize";

import {
  swiftuiVisibility,
  swiftuiOpacity,
  swiftuiRotation,
  swiftuiBlendMode,
} from "./builderImpl/swiftuiBlend";
import {
  commonIsAbsolutePosition,
  getCommonPositionValue,
} from "../common/commonPosition";
import { SwiftUIElement } from "./builderImpl/swiftuiParser";
import { SwiftUIModifier } from "types";
import { swiftuiSolidColor } from "./builderImpl/swiftuiColor";

export class SwiftuiDefaultBuilder {
  element: SwiftUIElement;

  constructor(kind: string = "") {
    this.element = new SwiftUIElement(kind);
  }

  pushModifier(...args: (SwiftUIModifier | null)[]): void {
    args.forEach((modifier) => {
      if (modifier) {
        this.element.addModifier(modifier);
      }
    });
  }

  commonPositionStyles(node: SceneNode): this {
    this.position(node);
    if ("layoutAlign" in node && "opacity" in node) {
      this.blend(node);
    }
    return this;
  }

  blend(node: SceneNode & LayoutMixin & MinimalBlendMixin): this {
    this.pushModifier(
      swiftuiVisibility(node),
      swiftuiRotation(node),
      swiftuiOpacity(node),
      swiftuiBlendMode(node),
    );

    return this;
  }

  topLeftToCenterOffset(
    x: number,
    y: number,
    node: SceneNode,
    parent: (BaseNode & ChildrenMixin) | null,
  ): { centerX: number; centerY: number } {
    if (!parent || !("width" in parent)) {
      return { centerX: 0, centerY: 0 };
    }
    // Find the child's center coordinates
    const centerX = x + node.width / 2;
    const centerY = y + node.height / 2;

    // Calculate the center-based offset
    const centerBasedX = centerX - parent.width / 2;
    const centerBasedY = centerY - parent.height / 2;

    return { centerX: centerBasedX, centerY: centerBasedY };
  }

  position(node: SceneNode): this {
    if (commonIsAbsolutePosition(node)) {
      const { x, y } = getCommonPositionValue(node);
      const { centerX, centerY } = this.topLeftToCenterOffset(
        x,
        y,
        node,
        node.parent,
      );

      this.pushModifier([
        `offset`,
        `x: ${numberToFixedString(centerX)}, y: ${numberToFixedString(centerY)}`,
      ]);
    }
    return this;
  }

  shapeBorder(node: SceneNode): this {
    const borders = swiftuiBorder(node);
    if (borders) {
      borders.forEach((border) => {
        this.element.addModifierMixed("overlay", border);
      });
    }
    return this;
  }

  shapeBackground(node: SceneNode): this {
    if ("fills" in node) {
      const background = swiftuiSolidColor(node, "fills");
      if (background) {
        this.pushModifier([`background`, background]);
      }
    }
    return this;
  }

  shapeForeground(node: SceneNode): this {
    if (!("children" in node) || node.children.length === 0) {
      this.pushModifier([`foregroundColor`, ".clear"]);
    }
    return this;
  }

  cornerRadius(node: SceneNode): this {
    const corner = swiftuiCornerRadius(node);
    if (corner) {
      this.pushModifier([`cornerRadius`, corner]);
    }
    return this;
  }

  effects(node: SceneNode): this {
    if (node.type === "GROUP") {
      return this;
    }

    this.pushModifier(swiftuiBlur(node), swiftuiShadow(node));

    return this;
  }

  size(node: SceneNode): this {
    const { width, height, constraints } = swiftuiSize(node);
    if (width || height) {
      this.pushModifier([`frame`, [width, height].filter(Boolean).join(", ")]);
    }

    // Add constraints if any exist
    if (constraints.length > 0) {
      this.pushModifier([`frame`, constraints.join(", ")]);
    }

    return this;
  }

  autoLayoutPadding(node: SceneNode): this {
    if ("paddingLeft" in node) {
      this.pushModifier(swiftuiPadding(node));
    }
    return this;
  }

  build(indentLevel: number = 0): string {
    // this.element.element = kind;
    return this.element.toString(indentLevel);
  }
}
