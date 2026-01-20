import { describe, it, expect } from 'vitest';
import { passAllObjectValuesThroughStringTransformerAndReturnNewObject } from './objectUtils';

describe('passAllObjectValuesThroughStringTransformerAndReturnNewObject', () => {
    it('should transform strings in a simple object', () => {
        const input = { a: 'hello', b: 123 };
        const result = passAllObjectValuesThroughStringTransformerAndReturnNewObject(input);
        expect(result.a).toBe("'hello'");
        expect(result.b).toBe(123);
    });

    it('should recursively transform nested objects', () => {
        const input = {
            a: 'hello',
            child: {
                b: 'world',
                c: 456
            }
        };
        const result = passAllObjectValuesThroughStringTransformerAndReturnNewObject(input);
        expect(result.a).toBe("'hello'");
        expect((result.child as any).b).toBe("'world'"); // Expecting recursion to work
        expect((result.child as any).c).toBe(456);
    });

     it('should recursively transform nested arrays', () => {
        const input = {
            list: [
                { id: '1', name: 'item1' },
                'raw_string'
            ]
        };
        const result = passAllObjectValuesThroughStringTransformerAndReturnNewObject(input);

        const list = result.list as any[];
        expect(list[0].id).toBe("'1'");
        expect(list[0].name).toBe("'item1'");
        expect(list[1]).toBe("'raw_string'");
    });
});
