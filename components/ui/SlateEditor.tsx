"use client"

import { createEditor, Editor, Transforms, Element as SlateElement, Range } from "slate"
import { Slate, Editable, withReact, useSlate, ReactEditor } from "slate-react"
import { useCallback, useMemo, useState, useRef } from "react"
import { withHistory } from "slate-history"
import { Button, Card, Space, Dropdown, Tooltip, Input, Popover, Divider, Typography, Menu } from "antd"
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  PictureOutlined,
  LinkOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  DeleteOutlined,
  FontSizeOutlined,
  CodeOutlined,
  DownOutlined,
  MinusOutlined,
  PlusOutlined,
  SwapOutlined,
} from "@ant-design/icons"

const { Title, Paragraph, Text } = Typography

// Define custom element types
const ELEMENT_TYPES = {
  PARAGRAPH: "paragraph",
  HEADING_ONE: "heading-one",
  HEADING_TWO: "heading-two",
  BLOCK_QUOTE: "block-quote",
  NUMBERED_LIST: "numbered-list",
  BULLETED_LIST: "bulleted-list",
  LIST_ITEM: "list-item",
  IMAGE: "image",
  LINK: "link",
  CODE_BLOCK: "code-block",
}

// Define custom mark types
const MARK_TYPES = {
  BOLD: "bold",
  ITALIC: "italic",
  UNDERLINE: "underline",
  CODE: "code",
}

// Define alignment types
const TEXT_ALIGN_TYPES = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
}

// Define initial value for the editor
const initialValue = [
  {
    type: ELEMENT_TYPES.PARAGRAPH,
    children: [{ text: "Start writing or insert media. This editor supports rich text formatting, images, and more!" }],
    align: TEXT_ALIGN_TYPES.LEFT,
  },
]

// Custom editor functions
const CustomEditor = {
  isMarkActive(editor: Editor, format: string) {
    const marks = Editor.marks(editor) as any
    return marks ? marks[format] === true : false
  },

  toggleMark(editor: Editor, format: string) {
    const isActive = CustomEditor.isMarkActive(editor, format)

    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  },

  isBlockActive(editor: Editor, format: string, blockType: string = "type") {
    const { selection } = editor
    if (!selection) return false

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any)[blockType] === format,
      }),
    )

    return !!match
  },

  toggleBlock(editor: Editor, format: string, blockType: string = "type") {
    const isActive = CustomEditor.isBlockActive(editor, format, blockType)
    const isList = format === ELEMENT_TYPES.NUMBERED_LIST || format === ELEMENT_TYPES.BULLETED_LIST

    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        [ELEMENT_TYPES.NUMBERED_LIST, ELEMENT_TYPES.BULLETED_LIST].includes((n as any).type),
      split: true,
    })

    const newProperties: any = {
      type: isActive ? ELEMENT_TYPES.PARAGRAPH : isList ? ELEMENT_TYPES.LIST_ITEM : format,
    }

    Transforms.setNodes(editor, newProperties)

    if (!isActive && isList) {
      const block: any = { type: format, children: [] }
      Transforms.wrapNodes(editor, block)
    }
  },

  toggleAlign(editor: Editor, align: string) {
    const { selection } = editor
    if (!selection) return

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n),
      }),
    )

    if (match) {
      const [node] = match
      const currentAlign = (node as any).align || TEXT_ALIGN_TYPES.LEFT
      const newAlign = currentAlign === align ? TEXT_ALIGN_TYPES.LEFT : align

      Transforms.setNodes(
        editor,
        { align: newAlign } as any,
        { match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) },
      )
    }
  },

  insertImage(editor: Editor, url: string, alt: string = "", width: string = "100%", align: string = "center") {
    const image: any = {
      type: ELEMENT_TYPES.IMAGE,
      url,
      alt,
      width,
      align,
      children: [{ text: "" }],
    }

    // Insert the image node
    Transforms.insertNodes(editor, image)

    // Move selection after the image
    Transforms.move(editor, { distance: 1 })

    // Insert a paragraph after the image if there's no node after
    const [, path] =
      Editor.above(editor, {
        match: (n) => !Editor.isEditor(n),
      }) || []

    if (path) {
      const [, nextPath] = Editor.next(editor, { at: path }) || []
      if (!nextPath) {
        Transforms.insertNodes(
          editor,
          { type: ELEMENT_TYPES.PARAGRAPH, children: [{ text: "" }] } as any,
          { at: Editor.end(editor, []) },
        )
      }
    }
  },

  insertLink(editor: Editor, url: string, text: string) {
    if (editor.selection) {
      const link: any = {
        type: ELEMENT_TYPES.LINK,
        url,
        children: [{ text }],
      }

      if (Range.isCollapsed(editor.selection)) {
        Transforms.insertNodes(editor, link)
      } else {
        Transforms.wrapNodes(editor, link, { split: true })
        Transforms.collapse(editor, { edge: "end" })
      }
    }
  },
}

// Slate plugins
const withImages = (editor: ReactEditor) => {
  const { isVoid, deleteBackward } = editor

  editor.isVoid = (element: any) => {
    return element.type === ELEMENT_TYPES.IMAGE ? true : isVoid(element)
  }

  // Override the deleteBackward method to handle image deletion
  editor.deleteBackward = (unit: any) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const [node, path] = Editor.node(editor, selection)
      const [prevNode, prevPath] = Editor.previous(editor, { at: path }) || []

      // If the previous node is an image, we need to handle it specially
      if (prevNode && prevPath && (prevNode as any).type === ELEMENT_TYPES.IMAGE) {
        // Select the image node
        Transforms.select(editor, prevPath)
        // Show a confirmation dialog
        if (confirm("Are you sure you want to delete this image?")) {
          Transforms.removeNodes(editor)
        } else {
          // If user cancels, restore the original selection
          Transforms.select(editor, selection)
        }
        return
      }
    }

    // Default behavior for other cases
    deleteBackward(unit)
  }

  return editor
}

// Element component to render different block types
const Element = ({ attributes, children, element }: any) => {
  const style = element.align ? { textAlign: element.align } : {}

  switch (element.type) {
    case ELEMENT_TYPES.HEADING_ONE:
      return (
        <Title level={1} style={{ ...style, marginTop: 24, marginBottom: 16 }} {...attributes}>
          {children}
        </Title>
      )
    case ELEMENT_TYPES.HEADING_TWO:
      return (
        <Title level={2} style={{ ...style, marginTop: 20, marginBottom: 12 }} {...attributes}>
          {children}
        </Title>
      )
    case ELEMENT_TYPES.BLOCK_QUOTE:
      return (
        <blockquote
          {...attributes}
          style={{
            ...style,
            borderLeft: "4px solid #d9d9d9",
            paddingLeft: 16,
            paddingTop: 8,
            paddingBottom: 8,
            margin: "16px 0",
            fontStyle: "italic",
            color: "#595959",
          }}
        >
          {children}
        </blockquote>
      )
    case ELEMENT_TYPES.NUMBERED_LIST:
      return (
        <ol {...attributes} style={{ ...style, marginLeft: 24, marginTop: 16, marginBottom: 16 }}>
          {children}
        </ol>
      )
    case ELEMENT_TYPES.BULLETED_LIST:
      return (
        <ul {...attributes} style={{ ...style, marginLeft: 24, marginTop: 16, marginBottom: 16 }}>
          {children}
        </ul>
      )
    case ELEMENT_TYPES.LIST_ITEM:
      return (
        <li {...attributes} style={style}>
          {children}
        </li>
      )
    case ELEMENT_TYPES.IMAGE:
      return <ImageElement attributes={attributes} element={element} children={children} />
    case ELEMENT_TYPES.LINK:
      return (
        <a
          {...attributes}
          href={element.url}
          style={{ ...style, color: "#1890ff", textDecoration: "underline" }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      )
    case ELEMENT_TYPES.CODE_BLOCK:
      return (
        <pre
          {...attributes}
          style={{
            ...style,
            backgroundColor: "#f5f5f5",
            padding: 16,
            borderRadius: 4,
            margin: "16px 0",
            fontFamily: "monospace",
            fontSize: 14,
            overflowX: "auto",
          }}
        >
          <code>{children}</code>
        </pre>
      )
    default:
      return (
        <Paragraph style={{ ...style, margin: "12px 0" }} {...attributes}>
          {children}
        </Paragraph>
      )
  }
}

// Image element with controls
const ImageElement = ({ attributes, children, element }: any) => {
  const editor = useSlate() as ReactEditor
  const selected = useSelected(element)
  const [showControls, setShowControls] = useState(false)
  const [size, setSize] = useState(element.width || "100%")
  const [alignment, setAlignment] = useState(element.align || "center")

  const alignmentStyles: any = {
    left: { float: "left", marginRight: 16, marginBottom: 8 },
    center: { margin: "0 auto", display: "block" },
    right: { float: "right", marginLeft: 16, marginBottom: 8 },
  }

  const updateImageSize = (newSize: string) => {
    const path = ReactEditor.findPath(editor, element)
    Transforms.setNodes(editor, { width: newSize } as any, { at: path })
    setSize(newSize)
  }

  const updateImageAlignment = (newAlign: string) => {
    const path = ReactEditor.findPath(editor, element)
    Transforms.setNodes(editor, { align: newAlign } as any, { at: path })
    setAlignment(newAlign)
  }

  const deleteImage = () => {
    if (confirm("Are you sure you want to delete this image?")) {
      const path = ReactEditor.findPath(editor, element)
      Transforms.removeNodes(editor, { at: path })
    }
  }

  return (
    <div
      {...attributes}
      className="relative my-4 inline-block"
      style={{
        width: size,
        position: "relative",
        ...alignmentStyles[alignment],
        outline: selected ? "2px solid #1890ff" : "none",
      }}
      contentEditable={false}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div style={{ position: "relative" }}>
        <img
          src={element.url || "/placeholder.svg"}
          alt={element.alt || ""}
          style={{
            maxWidth: "100%",
            borderRadius: 4,
            width: "100%",
          }}
        />

        {(showControls || selected) && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              gap: 4,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: 4,
              borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            <Tooltip title="Resize">
              <Button
                icon={size === "100%" ? <MinusOutlined /> : size === "50%" ? <MinusOutlined /> : <PlusOutlined />}
                size="small"
                onClick={() => updateImageSize(size === "100%" ? "50%" : size === "50%" ? "25%" : "100%")}
              />
            </Tooltip>

            <Tooltip title="Change alignment">
              <Button
                icon={<SwapOutlined />}
                size="small"
                onClick={() =>
                  updateImageAlignment(alignment === "left" ? "center" : alignment === "center" ? "right" : "left")
                }
              />
            </Tooltip>

            <Tooltip title="Delete">
              <Button icon={<DeleteOutlined />} size="small" danger onClick={deleteImage} />
            </Tooltip>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

// Custom hook to check if an element is selected
const useSelected = (element: any) => {
  const editor = useSlate() as ReactEditor
  const { selection } = editor

  if (!selection) return false

  try {
    const path = ReactEditor.findPath(editor, element)
    const [match] = Editor.nodes(editor, {
      at: selection,
      match: (n) => n === element,
    })

    return !!match
  } catch (error) {
    return false
  }
}

// Leaf component to render text with marks
const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  if (leaf.code) {
    children = (
      <code
        style={{
          backgroundColor: "#f5f5f5",
          padding: "2px 4px",
          borderRadius: 4,
          fontFamily: "monospace",
          fontSize: 14,
        }}
      >
        {children}
      </code>
    )
  }

  return <span {...attributes}>{children}</span>
}

// Toolbar component
const Toolbar = () => {
  const editor = useSlate()
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const linkInputRef = useRef(null)

  const handleInsertLink = () => {
    if (linkUrl) {
      CustomEditor.insertLink(editor, linkUrl, linkText || linkUrl)
      setLinkUrl("")
      setLinkText("")
    }
  }

  const handleInsertImage = () => {
    const url = prompt("Enter image URL:")
    if (url) {
      CustomEditor.insertImage(editor, url)
    }
  }

  const formatMenu = (
    <Menu
      items={[
        {
          key: "paragraph",
          label: "Normal",
          icon: <FontSizeOutlined />,
          onClick: () => CustomEditor.toggleBlock(editor, ELEMENT_TYPES.PARAGRAPH),
        },
        {
          key: "heading-one",
          label: "Heading 1",
          icon: <span style={{ fontWeight: "bold" }}>H1</span>,
          onClick: () => CustomEditor.toggleBlock(editor, ELEMENT_TYPES.HEADING_ONE),
        },
        {
          key: "heading-two",
          label: "Heading 2",
          icon: <span style={{ fontWeight: "bold" }}>H2</span>,
          onClick: () => CustomEditor.toggleBlock(editor, ELEMENT_TYPES.HEADING_TWO),
        },
        {
          key: "block-quote",
          label: "Quote",
          icon: <span>"</span>,
          onClick: () => CustomEditor.toggleBlock(editor, ELEMENT_TYPES.BLOCK_QUOTE),
        },
        {
          key: "code-block",
          label: "Code Block",
          icon: <CodeOutlined />,
          onClick: () => CustomEditor.toggleBlock(editor, ELEMENT_TYPES.CODE_BLOCK),
        },
      ]}
    />
  )

  const linkContent = (
    <div style={{ width: 300 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Input
          placeholder="https://example.com"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          ref={linkInputRef}
          addonBefore="URL"
        />
        <Input
          placeholder="Link text (optional)"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          addonBefore="Text"
        />
        <Button type="primary" onClick={handleInsertLink} style={{ width: "100%" }}>
          Insert Link
        </Button>
      </Space>
    </div>
  )

  return (
    <Card
      bodyStyle={{ padding: 8 }}
      style={{ marginBottom: 0, borderBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
    >
      <Space wrap>
        <Tooltip title="Bold">
          <Button
            icon={<BoldOutlined />}
            type={CustomEditor.isMarkActive(editor, MARK_TYPES.BOLD) ? "primary" : "default"}
            onMouseDown={(e) => {
              e.preventDefault()
              CustomEditor.toggleMark(editor, MARK_TYPES.BOLD)
            }}
          />
        </Tooltip>

        <Tooltip title="Italic">
          <Button
            icon={<ItalicOutlined />}
            type={CustomEditor.isMarkActive(editor, MARK_TYPES.ITALIC) ? "primary" : "default"}
            onMouseDown={(e) => {
              e.preventDefault()
              CustomEditor.toggleMark(editor, MARK_TYPES.ITALIC)
            }}
          />
        </Tooltip>

        <Tooltip title="Underline">
          <Button
            icon={<UnderlineOutlined />}
            type={CustomEditor.isMarkActive(editor, MARK_TYPES.UNDERLINE) ? "primary" : "default"}
            onMouseDown={(e) => {
              e.preventDefault()
              CustomEditor.toggleMark(editor, MARK_TYPES.UNDERLINE)
            }}
          />
        </Tooltip>

        <Divider type="vertical" />

        <Dropdown overlay={formatMenu} trigger={["click"]}>
          <Button>
            <Space>
              Format
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>

        <Tooltip title="Bullet List">
          <Button
            icon={<UnorderedListOutlined />}
            type={CustomEditor.isBlockActive(editor, ELEMENT_TYPES.BULLETED_LIST) ? "primary" : "default"}
            onMouseDown={(e) => {
              e.preventDefault()
              CustomEditor.toggleBlock(editor, ELEMENT_TYPES.BULLETED_LIST)
            }}
          />
        </Tooltip>

        <Tooltip title="Numbered List">
          <Button
            icon={<OrderedListOutlined />}
            type={CustomEditor.isBlockActive(editor, ELEMENT_TYPES.NUMBERED_LIST) ? "primary" : "default"}
            onMouseDown={(e) => {
              e.preventDefault()
              CustomEditor.toggleBlock(editor, ELEMENT_TYPES.NUMBERED_LIST)
            }}
          />
        </Tooltip>

        <Divider type="vertical" />

        <Tooltip title="Align Left">
          <Button
            icon={<AlignLeftOutlined />}
            type={CustomEditor.isBlockActive(editor, TEXT_ALIGN_TYPES.LEFT, "align") ? "primary" : "default"}
            onMouseDown={(e) => {
              e.preventDefault()
              CustomEditor.toggleAlign(editor, TEXT_ALIGN_TYPES.LEFT)
            }}
          />
        </Tooltip>

        <Tooltip title="Align Center">
          <Button
            icon={<AlignCenterOutlined />}
            type={CustomEditor.isBlockActive(editor, TEXT_ALIGN_TYPES.CENTER, "align") ? "primary" : "default"}
            onMouseDown={(e) => {
              e.preventDefault()
              CustomEditor.toggleAlign(editor, TEXT_ALIGN_TYPES.CENTER)
            }}
          />
        </Tooltip>

        <Tooltip title="Align Right">
          <Button
            icon={<AlignRightOutlined />}
            type={CustomEditor.isBlockActive(editor, TEXT_ALIGN_TYPES.RIGHT, "align") ? "primary" : "default"}
            onMouseDown={(e) => {
              e.preventDefault()
              CustomEditor.toggleAlign(editor, TEXT_ALIGN_TYPES.RIGHT)
            }}
          />
        </Tooltip>

        <Divider type="vertical" />

        <Popover content={linkContent} title="Insert Link" trigger="click" placement="bottom">
          <Button icon={<LinkOutlined />} />
        </Popover>

        <Tooltip title="Insert Image">
          <Button
            icon={<PictureOutlined />}
            onMouseDown={(e) => {
              e.preventDefault()
              handleInsertImage()
            }}
          />
        </Tooltip>
      </Space>
    </Card>
  )
}

// Main editor component
export default function RichTextEditor() {
  const editor = useMemo(() => withHistory(withImages(withReact(createEditor()))), [])
  const [value, setValue] = useState<any>(initialValue)

  // Convert Slate state to HTML for preview
  const renderToHtml = useCallback((nodes: any[]) => {
    return nodes
      .map((node: any) => {
        if (node.type === ELEMENT_TYPES.IMAGE) {
          const alignStyle =
            node.align === "left"
              ? "float: left; margin-right: 16px; margin-bottom: 8px;"
              : node.align === "right"
                ? "float: right; margin-left: 16px; margin-bottom: 8px;"
                : "margin: 0 auto; display: block;"

          return `<div style="${alignStyle} width: ${node.width || "100%"}">
            <img src="${node.url}" alt="${node.alt || ""}" style="max-width: 100%; border-radius: 4px;" />
          </div>`
        }

        if (node.type === ELEMENT_TYPES.LINK) {
          return `<a href="${node.url}" target="_blank" rel="noopener noreferrer" style="color: #1890ff; text-decoration: underline;">
            ${node.children.map((child: any) => child.text).join("")}
          </a>`
        }

        if (node.type === ELEMENT_TYPES.HEADING_ONE) {
          return `<h1 style="text-align: ${node.align || "left"}; font-size: 28px; font-weight: bold; margin-top: 24px; margin-bottom: 16px;">
            ${node.children.map((child: any) => renderLeaf(child)).join("")}
          </h1>`
        }

        if (node.type === ELEMENT_TYPES.HEADING_TWO) {
          return `<h2 style="text-align: ${node.align || "left"}; font-size: 22px; font-weight: bold; margin-top: 20px; margin-bottom: 12px;">
            ${node.children.map((child: any) => renderLeaf(child)).join("")}
          </h2>`
        }

        if (node.type === ELEMENT_TYPES.BLOCK_QUOTE) {
          return `<blockquote style="text-align: ${node.align || "left"}; border-left: 4px solid #d9d9d9; padding-left: 16px; padding-top: 8px; padding-bottom: 8px; margin: 16px 0; font-style: italic; color: #595959;">
            ${node.children.map((child: any) => renderLeaf(child)).join("")}
          </blockquote>`
        }

        if (node.type === ELEMENT_TYPES.NUMBERED_LIST) {
          return `<ol style="text-align: ${node.align || "left"}; margin-left: 24px; margin-top: 16px; margin-bottom: 16px;">
            ${node.children.map((child: any) => `<li>${child.children.map((grandChild: any) => renderLeaf(grandChild)).join("")}</li>`).join("")}
          </ol>`
        }

        if (node.type === ELEMENT_TYPES.BULLETED_LIST) {
          return `<ul style="text-align: ${node.align || "left"}; margin-left: 24px; margin-top: 16px; margin-bottom: 16px;">
            ${node.children.map((child: any) => `<li>${child.children.map((grandChild: any) => renderLeaf(grandChild)).join("")}</li>`).join("")}
          </ul>`
        }

        if (node.type === ELEMENT_TYPES.CODE_BLOCK) {
          return `<pre style="background-color: #f5f5f5; padding: 16px; border-radius: 4px; margin: 16px 0; font-family: monospace; font-size: 14px; overflow-x: auto;">
            <code>${node.children.map((child: any) => renderLeaf(child)).join("")}</code>
          </pre>`
        }

        // Default paragraph
        return `<p style="text-align: ${node.align || "left"}; margin: 12px 0;">
          ${node.children.map((child: any) => renderLeaf(child)).join("")}
        </p>`
      })
      .join("")
  }, [])

  const renderLeaf = useCallback((leaf: any) => {
    let text = leaf.text

    if (leaf.bold) {
      text = `<strong>${text}</strong>`
    }

    if (leaf.italic) {
      text = `<em>${text}</em>`
    }

    if (leaf.underline) {
      text = `<u>${text}</u>`
    }

    if (leaf.code) {
      text = `<code style="background-color: #f5f5f5; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 14px;">${text}</code>`
    }

    return text
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>
             Blog Editor
            </Title>
            <Text type="secondary">Format text, add images, and create rich content</Text>
          </div>
        }
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
      >
        <Slate
          editor={editor}
          initialValue={value}
          onChange={(newValue) => {
            setValue(newValue)
          }}
        >
          <Toolbar />
          <Card
            bodyStyle={{ padding: 16, minHeight: 300 }}
            style={{
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              marginTop: -1,
            }}
          >
            <Editable
              style={{ outline: "none", minHeight: 250 }}
              renderElement={(props) => <Element {...props} />}
              renderLeaf={(props) => <Leaf {...props} />}
              placeholder="Start writing or insert media..."
              spellCheck
              autoFocus
            />
          </Card>
        </Slate>

        <Card title="Preview" style={{ marginTop: 16, backgroundColor: "#fafafa" }}>
          <div style={{ padding: 8 }} dangerouslySetInnerHTML={{ __html: renderToHtml(value) }} />
        </Card>
      </Card>
    </div>
  )
}
