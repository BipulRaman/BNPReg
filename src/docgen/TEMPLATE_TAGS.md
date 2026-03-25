# Template Custom Tags Reference

All templates are self-contained HTML files in `src/docgen/templates/`. Logic is expressed through 7 custom `<tpl-*>` tags — no external TypeScript code needed.

Templates are auto-discovered at build time via the glob in `templateLoader.ts`.

---

## Table of Contents

1. [Placeholders](#placeholders)
2. [Custom Tags](#custom-tags)
   - [tpl-if — Conditional](#tpl-if--conditional)
   - [tpl-each — Repeat per line](#tpl-each--repeat-per-line)
   - [tpl-rows — Dynamic table rows](#tpl-rows--dynamic-table-rows)
   - [tpl-n — Serial number](#tpl-n--serial-number)
   - [tpl-val — Value with formatting](#tpl-val--value-with-formatting)
   - [tpl-sum — Aggregate](#tpl-sum--aggregate)
   - [tpl-date — Today's date](#tpl-date--todays-date)
3. [Utility Attribute](#utility-attribute)
4. [Template Metadata](#template-metadata)
5. [Processing Pipeline](#processing-pipeline)
6. [Gotchas & Tips](#gotchas--tips)
7. [Full Examples](#full-examples)

---

## Placeholders

Placeholders are embedded in template HTML using double-brace syntax:

```
{{key|Label}}              → text input (single line)
{{key|Label|date}}         → date picker input
{{key|Label|textarea}}     → plain textarea (rendered as markdown in output)
{{key|Label|markdown}}     → textarea with B/I/H/•/1. toolbar (rendered as markdown)
{{TODAY}}                   → auto-filled with today's date (e.g. 25 March 2026)
```

**Rules:**
- `key` must be `\w+` (letters, digits, underscore).
- `Label` is shown in the form and as placeholder text when empty.
- Fields inside `<tpl-rows>` are auto-excluded from the top-level form — they appear in the dynamic row UI instead.

### Scenario: Simple letter fields

```html
<p>Invoice No: {{invoice_number|Invoice Number}}</p>       <!-- text input -->
<p>Date: {{TODAY}}</p>                                       <!-- auto today -->
<p>{{party_name|Party Name}}</p>                             <!-- text input -->
<p>{{content|Letter Content|markdown}}</p>                   <!-- markdown editor with toolbar -->
```

**What the user sees in the form:**

| Label | Input type |
|---|---|
| Invoice Number | Text field |
| Party Name | Text field |
| Letter Content | Textarea with **B** *I* H • 1. toolbar |

---

## Custom Tags

### `<tpl-if>` — Conditional

Shows or hides a block based on whether a placeholder has a value.

**Syntax:**
```html
<tpl-if key="KEY" [eq="VALUE"] [default="FALLBACK"]>
  ...content...
</tpl-if>
```

**Attributes:**

| Attribute | Required | Description |
|---|---|---|
| `key` | Yes | Placeholder key to check |
| `eq` | No | Show only if key equals this exact value |
| `default` | No | Text to display when the condition is false |

#### Scenario 1: Optional notes section

Only show "Note:" when the user has typed something. The entire block is removed from the output when empty — not just hidden.

```html
<tpl-if key="notes">
  <div style="font-size: 10.5pt;">
    <strong>Note:</strong> {{notes|Additional Notes|textarea}}
  </div>
</tpl-if>
```

> **Tip:** Use `<div>` instead of `<p>` as the wrapper when the placeholder uses `textarea` or `markdown`, because markdown renders `<p>` tags internally — and `<p>` inside `<p>` causes HTML nesting issues.

#### Scenario 2: Conditional section by type

Show a thank-you message only when `type` is "donation":

```html
<tpl-if key="type" eq="donation">
  <p>Thank you for your generous donation to Bihar Navodaya Pariwar!</p>
</tpl-if>

<tpl-if key="type" eq="sponsorship">
  <p>We appreciate your sponsorship for this event.</p>
</tpl-if>
```

#### Scenario 3: Fallback text when empty

Show the phone number if provided, otherwise show "N/A":

```html
<p>Phone: <tpl-if key="phone" default="N/A">{{phone|Phone}}</tpl-if></p>
```

**Output when phone = "9876543210":** `Phone: 9876543210`
**Output when phone is empty:** `Phone: N/A`

---

### `<tpl-each>` — Repeat per line

Repeats a block of HTML for each line of a textarea value. Use `$item` as the placeholder for the current line's text.

**Syntax:**
```html
<tpl-each key="KEY">
  ...HTML with $item...
</tpl-each>
```

#### Scenario: Guest list as bullet points

Form field:
```html
{{guests|Guest Names|textarea}}
```

User types (each name on a new line):
```
Amit Kumar
Priya Singh
Rahul Verma
```

Template:
```html
<h3>Guests:</h3>
<ul>
  <tpl-each key="guests">
    <li>$item</li>
  </tpl-each>
</ul>
```

**Output:**
```html
<h3>Guests:</h3>
<ul>
  <li>Amit Kumar</li>
  <li>Priya Singh</li>
  <li>Rahul Verma</li>
</ul>
```

#### Scenario: CC recipients in a letter

```html
<tpl-if key="cc">
  <p><strong>CC:</strong></p>
  <tpl-each key="cc">
    <p style="margin-left: 16px;">$item</p>
  </tpl-each>
</tpl-if>
```

---

### `<tpl-rows>` — Dynamic table rows

Defines a **single template row** that the system clones N times. The form shows:
- Inline fields per row (side by side)
- `+` / `−` buttons to add/remove rows
- A dashed "Add item" button at the bottom

Empty rows are auto-removed from the output. Surviving rows are renumbered and given alternating background stripes.

**Syntax:**
```html
<tpl-rows group="GROUP_NAME">
  <tr>
    <td>...</td>
  </tr>
</tpl-rows>
```

Placeholder keys are auto-suffixed: `item` → `item_1`, `item_2`, `item_3`, etc.

#### Scenario: Invoice line items

```html
<table>
  <thead>
    <tr>
      <th>S.No.</th>
      <th>Item / Description</th>
      <th>Amount (₹)</th>
    </tr>
  </thead>
  <tbody>
    <tpl-rows group="items">
    <tr>
      <td><tpl-n /></td>
      <td>{{item|Item Description}}</td>
      <td><tpl-val group="items" currency>{{amount|Amount}}</tpl-val></td>
    </tr>
    </tpl-rows>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2">Total</td>
      <td><tpl-sum group="items" /></td>
    </tr>
  </tfoot>
</table>
<p>Amount in Words: <tpl-sum group="items" words /> only.</p>
```

**What the user sees in the form:**

```
Items (3)                         [−] [+]
  1  [Venue Decoration    ] [15000 ]
  2  [Sound System        ] [8000  ]
  3  [Catering            ] [25000 ]
  [        + Add item             ]
```

**What the output shows:**

| S.No. | Item / Description | Amount (₹) |
|---|---|---|
| 1 | Venue Decoration | ₹ 15,000 |
| 2 | Sound System | ₹ 8,000 |
| 3 | Catering | ₹ 25,000 |
| | **Total** | **₹ 48,000** |

Amount in Words: Rupees Forty Eight Thousand only.

#### Scenario: Attendee list with details

```html
<tpl-rows group="attendees">
<tr>
  <td><tpl-n /></td>
  <td>{{name|Name}}</td>
  <td>{{jnv|JNV}}</td>
  <td>{{batch|Batch}}</td>
</tr>
</tpl-rows>
```

Each row in the form shows 3 fields side by side: Name, JNV, Batch.

---

### `<tpl-n />` — Serial number

Self-closing tag that outputs an auto-incrementing serial number inside `<tpl-rows>`. Renumbers automatically when empty rows are removed.

```html
<td><tpl-n /></td>
```

Row 1 filled, Row 2 empty, Row 3 filled → Output shows serial 1, 2 (not 1, 3).

---

### `<tpl-val>` — Value with formatting

Wraps a value with optional formatting and/or aggregation.

**Syntax:**
```html
<tpl-val [group="G"] [currency] [format="upper|date|number"]>
  ...content...
</tpl-val>
```

**Attributes:**

| Attribute | Effect |
|---|---|
| `group="g"` | Value contributes to `<tpl-sum group="g">` totals |
| `currency` | Adds ₹ prefix to the value |
| `format="upper"` | Uppercases the text |
| `format="date"` | Formats text as locale date (25 March 2026) |
| `format="number"` | Formats as Indian locale number (1,00,000) |

#### Scenario: Currency amount in a table

```html
<td><tpl-val group="items" currency>{{amount|Amount}}</tpl-val></td>
```

User types `15000` → Output: `₹ 15000`

#### Scenario: Uppercase subject line

```html
<p><tpl-val format="upper">{{subject|Subject}}</tpl-val></p>
```

User types `blood donation camp` → Output: `BLOOD DONATION CAMP`

#### Scenario: Format a date field

```html
<p>Event Date: <tpl-val format="date">{{event_date|Event Date|date}}</tpl-val></p>
```

User picks `2026-04-05` → Output: `5 April 2026`

---

### `<tpl-sum />` — Aggregate

Calculates and displays an aggregate for a `<tpl-rows>` group. Self-closing tag.

**Syntax:**
```html
<tpl-sum group="GROUP" [count] [words] />
```

**Modes:**

| Usage | Output |
|---|---|
| `<tpl-sum group="items" />` | ₹ 48,000 |
| `<tpl-sum group="items" words />` | Rupees Forty Eight Thousand |
| `<tpl-sum group="items" count />` | 3 |

#### Scenario: Invoice footer

```html
<tr>
  <td colspan="2" style="text-align: right;">Total</td>
  <td><tpl-sum group="items" /></td>
</tr>
```

#### Scenario: Amount in words

```html
<p><strong>Amount in Words:</strong> <tpl-sum group="items" words /> only.</p>
```

Output: **Amount in Words:** Rupees Forty Eight Thousand only.

#### Scenario: Display number of items

```html
<p>Total items: <tpl-sum group="items" count /></p>
```

Output: Total items: 3

---

### `<tpl-date />` — Today's date

Inserts today's date. Self-closing tag.

```html
<tpl-date />                  → 25 March 2026  (long format)
<tpl-date format="short" />   → 25 Mar 2026    (short format)
```

#### Scenario: Letter date aligned right

```html
<p style="text-align: right;">Date: <tpl-date /></p>
```

---

## Utility Attribute

### `tpl-break` — Page break

Add this attribute to any element to force a CSS page break before it in PDF export. Useful for multi-page documents.

```html
<div tpl-break>
  <h2>Page 2 — Terms & Conditions</h2>
  <p>...</p>
</div>
```

---

## Template Metadata

Every HTML file **must** start with a metadata comment:

```html
<!-- template: { "id": "bnp-invoice", "name": "Invoice", "title": "BNP_Invoice__#invoice_number#_" } -->
```

| Field | Description |
|---|---|
| `id` | Unique identifier (used internally, no spaces) |
| `name` | Display name shown in the template dropdown |
| `title` | PDF filename pattern. `#key#` is replaced with the value of that placeholder |

**Title examples:**
- `"BNP_Invoice__#invoice_number#_"` → `BNP_Invoice__INV-2026-001_`
- `"BNP_Letter___#to#_"` → `BNP_Letter___Dr. Amit Kumar_`

---

## Processing Pipeline

Understanding the order helps avoid issues:

```
1. preProcessTags()     — Expands <tpl-rows>, <tpl-if>, <tpl-each>, <tpl-date>
                          (creates/removes placeholders in the raw HTML string)

2. renderTemplate()     — Replaces {{key|Label}} with values
                          (text fields escaped, textarea/markdown run through marked)

3. postProcessTemplate() — DOM-level processing:
                          • translateInlineTags() — converts <tpl-n>, <tpl-val>, <tpl-sum> to data-attrs
                          • Row group processing — removes empty rows, renumbers, stripes
                          • Currency prefix — adds ₹
                          • Format — uppercase, date, number
                          • Sum/count/words — calculates aggregates
                          • Page breaks
```

---

## Gotchas & Tips

### Use `<div>` not `<p>` around markdown fields

Markdown renders `<p>` tags internally. Nesting `<p>` inside `<p>` causes the browser to auto-close the outer one, losing your styles.

```html
<!-- ❌ BAD — font-size gets lost -->
<p style="font-size: 10.5pt;">
  <strong>Note:</strong> {{notes|Notes|textarea}}
</p>

<!-- ✅ GOOD — div can contain <p> -->
<div style="font-size: 10.5pt;">
  <strong>Note:</strong> {{notes|Notes|textarea}}
</div>
```

### `<tpl-rows>` uses a single template row

Don't repeat `<tr>` blocks for each row. Define ONE row — the system clones it. Keys are auto-suffixed with `_1`, `_2`, etc.

```html
<!-- ❌ BAD — old static approach -->
<tr><td>{{item_1|Item 1}}</td></tr>
<tr><td>{{item_2|Item 2}}</td></tr>
<tr><td>{{item_3|Item 3}}</td></tr>

<!-- ✅ GOOD — dynamic, user controls row count -->
<tpl-rows group="items">
  <tr><td>{{item|Item}}</td></tr>
</tpl-rows>
```

### `<tpl-val group>` is required for `<tpl-sum>` to work

If you want `<tpl-sum group="items" />` to calculate a total, each contributing cell **must** use `<tpl-val group="items">`:

```html
<!-- This amount contributes to the total -->
<tpl-val group="items" currency>{{amount|Amount}}</tpl-val>

<!-- This calculates the total of all group="items" values -->
<tpl-sum group="items" />
```

### Combine tags freely

Tags can be nested and combined:

```html
<!-- Conditional row count display -->
<tpl-if key="show_count" eq="yes">
  <p>Number of items: <tpl-sum group="items" count /></p>
</tpl-if>

<!-- Currency value that also contributes to a total, formatted as uppercase -->
<tpl-val group="fees" currency format="upper">{{fee|Fee}}</tpl-val>
```

---

## Full Examples

### Example 1: Invoice with dynamic rows

```html
<!-- template: { "id": "my-invoice", "name": "My Invoice", "title": "Invoice___#invoice_no#_" } -->
<div class="letter-body">

  <p style="text-align: right;">Date: <tpl-date /></p>
  <p>Invoice No: {{invoice_no|Invoice Number}}</p>

  <p><strong>Bill To:</strong><br/>
    {{party|Party Name}}<br/>
    {{address|Address}}
  </p>

  <p><strong>Subject:</strong> {{subject|Subject}}</p>

  <table>
    <thead>
      <tr><th>S.No.</th><th>Description</th><th>Amount (₹)</th></tr>
    </thead>
    <tbody>
      <tpl-rows group="items">
      <tr>
        <td><tpl-n /></td>
        <td>{{desc|Description}}</td>
        <td><tpl-val group="items" currency>{{amt|Amount}}</tpl-val></td>
      </tr>
      </tpl-rows>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Total</td>
        <td><tpl-sum group="items" /></td>
      </tr>
    </tfoot>
  </table>

  <p><strong>In Words:</strong> <tpl-sum group="items" words /> only.</p>

  <tpl-if key="notes">
    <div><strong>Note:</strong> {{notes|Notes|textarea}}</div>
  </tpl-if>

  <p style="text-align: right; margin-top: 40px;">Authorized Signatory</p>
</div>
```

### Example 2: Letter with markdown content

```html
<!-- template: { "id": "my-letter", "name": "Blank Letter", "title": "Letter___#to#_" } -->
<div class="letter-body">

  <style>
    .content p { margin: 0; }
    .content ul, .content ol { margin: 4px 0; padding-left: 24px; }
  </style>

  <p style="text-align: right;">Date: <tpl-date /></p>
  <p>Ref: {{ref|Reference}}</p>

  <p><strong>To,</strong></p>
  <div>{{to|Recipient|markdown}}</div>

  <p><strong>Subject:</strong> {{subject|Subject}}</p>

  <div class="content" style="text-align: justify;">
    {{content|Content|markdown}}
  </div>

  <div style="margin-top: 28px;">
    <p>With warm regards,</p>
    <div>{{signer|Name & Designation|markdown}}</div>
  </div>
</div>
```

### Example 3: Event registration list with conditional sections

```html
<!-- template: { "id": "event-list", "name": "Event List", "title": "Event___#event_name#_" } -->
<div class="letter-body">

  <p>Date: <tpl-date format="short" /></p>
  <h2>{{event_name|Event Name}}</h2>

  <tpl-if key="venue">
    <p><strong>Venue:</strong> {{venue|Venue}}</p>
  </tpl-if>

  <table>
    <thead>
      <tr><th>#</th><th>Name</th><th>JNV</th><th>Batch</th></tr>
    </thead>
    <tbody>
      <tpl-rows group="attendees">
      <tr>
        <td><tpl-n /></td>
        <td>{{name|Name}}</td>
        <td>{{jnv|JNV}}</td>
        <td>{{batch|Batch}}</td>
      </tr>
      </tpl-rows>
    </tbody>
  </table>

  <p>Total Attendees: <tpl-sum group="attendees" count /></p>

  <tpl-if key="special_guests">
    <h3>Special Guests:</h3>
    <ul>
      <tpl-each key="special_guests">
        <li>$item</li>
      </tpl-each>
    </ul>
  </tpl-if>
</div>
```
```
