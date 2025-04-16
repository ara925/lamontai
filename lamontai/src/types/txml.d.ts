/**
 * Type declarations for txml module
 */

declare module 'txml' {
  export interface XmlElement {
    tagName: string;
    attributes?: Record<string, string>;
    children: Array<XmlElement | string>;
  }

  export function parse(
    xml: string, 
    options?: { 
      keepWhitespace?: boolean; 
      noChildNodes?: string[]; 
      simplify?: boolean;
    }
  ): Array<XmlElement | string>;

  export function simplify(
    xml: Array<XmlElement | string>,
    options?: { 
      removeAttr?: boolean; 
      filter?: string[]; 
      attrKey?: string; 
      textKey?: string;
    }
  ): any;

  export function simplifyLostLess(
    xml: Array<XmlElement | string>,
    options?: { 
      attrKey?: string; 
      textKey?: string;
    }
  ): any;
} 