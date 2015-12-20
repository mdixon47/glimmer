import { Dict, LinkedListNode, Slice, InternedString, dict, intern } from 'glimmer-util';
import Template from './template';
import { Environment } from './environment';
import { CompiledExpression } from './compiled/expressions';
import { Opcode } from './opcodes';
import { RawTemplate } from './compiler';

export type PrettyPrintValue = PrettyPrint | string | string[] | PrettyPrintValueArray | PrettyPrintValueDict;

interface PrettyPrintValueArray extends Array<PrettyPrintValue> {

}

interface PrettyPrintValueDict extends Dict<PrettyPrintValue> {

}

export class PrettyPrint {
  type: string;
  operation: string;
  params: PrettyPrintValue[];
  hash: Dict<PrettyPrintValue>;
  templates: Dict<number>;

  constructor(type: string, operation: string, params: PrettyPrintValue[]=null, hash: Dict<PrettyPrintValue>=null, templates: Dict<number>=null) {
    this.type = type;
    this.operation = operation;
    this.params = params;
    this.hash = hash;
    this.templates = templates;
  }
}

export interface PrettyPrintable {
  prettyPrint(): PrettyPrint;
}

abstract class Syntax<T extends LinkedListNode> implements LinkedListNode {
  static fromSpec(spec: any, templates: RawTemplate[]): Syntax<any> {
    throw new Error(`You need to implement fromSpec on ${this}`);
  }

  public type: string;
  public next: T = null;
  public prev: T = null;

  prettyPrint(): PrettyPrintValue {
    return `<${this.type}>`;
  }
}

export default Syntax;

export interface CompileInto {
  append(op: Opcode);
  getSymbol(name: InternedString): number;
}

export abstract class StatementSyntax extends Syntax<StatementSyntax> {
  static fromSpec<T extends StatementSyntax>(spec: any, templates: RawTemplate[]): T {
    throw new Error(`You need to implement fromSpec on ${this}`);
  }

  prettyPrint(): any {
    return new PrettyPrint(this.type, this.type);
  }

  clone(): this {
    // not type safe but the alternative is extreme boilerplate per
    // syntax subclass.
    return new (<new (any) => any>this.constructor)(this);
  }

  abstract compile(opcodes: CompileInto, env: Environment);
}

export type Program = Slice<StatementSyntax>;

export const ATTRIBUTE_SYNTAX = "e1185d30-7cac-4b12-b26a-35327d905d92";

export abstract class AttributeSyntax extends StatementSyntax {
  "e1185d30-7cac-4b12-b26a-35327d905d92": boolean;
  name: InternedString;
  namespace: InternedString;

  lookupName(): InternedString {
    return intern(`@${this.name}`);
  }

  abstract toLookup(): { syntax: AttributeSyntax, symbol: InternedString };
  abstract valueSyntax(): ExpressionSyntax;
  abstract isAttribute(): boolean;
}

export abstract class ExpressionSyntax extends Syntax<ExpressionSyntax> {
  public type: string;

  prettyPrint(): PrettyPrintValue {
    return `${this.type}`;
  }

  abstract compile(compiler: CompileInto, env: Environment): CompiledExpression;
}