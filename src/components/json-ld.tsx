/**
 * JSON-LD structured data injection via React children (no innerHTML).
 * Content must be a typed server-side object — no user input.
 */

type JsonLdProps = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
};

export function JsonLd({ id, data }: JsonLdProps) {
  // Using children pattern — React renders string children of <script> as text,
  // not as HTML, so there is no XSS surface here.
  // ref: https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld
  return (
    <script id={id} type="application/ld+json">
      {JSON.stringify(data)}
    </script>
  );
}
