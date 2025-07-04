import { ScriptElement } from '@/types'

// Export formats
export type ExportFormat = 'pdf' | 'fdx' | 'fountain' | 'txt'

// Standard screenplay formatting constants
export const SCREENPLAY_FORMAT = {
  // Page dimensions (in points, 72 points = 1 inch)
  PAGE_WIDTH: 612, // 8.5 inches
  PAGE_HEIGHT: 792, // 11 inches
  
  // Margins (in points)
  MARGIN_TOP: 72, // 1 inch
  MARGIN_BOTTOM: 72, // 1 inch  
  MARGIN_LEFT: 90, // 1.25 inches
  MARGIN_RIGHT: 72, // 1 inch
  
  // Element positioning (from left margin)
  SCENE_HEADING_INDENT: 0,
  ACTION_INDENT: 0,
  CHARACTER_INDENT: 216, // 3 inches from left
  DIALOGUE_INDENT: 144, // 2 inches from left
  PARENTHETICAL_INDENT: 180, // 2.5 inches from left
  TRANSITION_INDENT: 432, // 6 inches from left
  
  // Line spacing
  LINE_HEIGHT: 12,
  ELEMENT_SPACING: 12,
  
  // Font
  FONT_FAMILY: 'Courier',
  FONT_SIZE: 12
}

// Convert script elements to fountain format
export function exportToFountain(elements: ScriptElement[], title: string): string {
  let fountain = `Title: ${title}\n\n`
  
  elements.forEach(element => {
    if (!element.content.trim()) return
    
    switch (element.type) {
      case 'scene_heading':
        fountain += `${element.content.toUpperCase()}\n\n`
        break
      case 'action':
        fountain += `${element.content}\n\n`
        break
      case 'character':
        fountain += `${element.content.toUpperCase()}\n`
        break
      case 'dialogue':
        fountain += `${element.content}\n\n`
        break
      case 'parenthetical':
        fountain += `${element.content}\n`
        break
      case 'transition':
        fountain += `${element.content.toUpperCase()}\n\n`
        break
      case 'shot':
        fountain += `${element.content.toUpperCase()}\n\n`
        break
    }
  })
  
  return fountain
}

// Convert script elements to plain text
export function exportToText(elements: ScriptElement[], title: string): string {
  let text = `${title}\n${'='.repeat(title.length)}\n\n`
  
  elements.forEach(element => {
    if (!element.content.trim()) return
    
    switch (element.type) {
      case 'scene_heading':
        text += `${element.content.toUpperCase()}\n\n`
        break
      case 'action':
        text += `${element.content}\n\n`
        break
      case 'character':
        text += `                    ${element.content.toUpperCase()}\n`
        break
      case 'dialogue':
        text += `          ${element.content}\n\n`
        break
      case 'parenthetical':
        text += `               ${element.content}\n`
        break
      case 'transition':
        text += `                                        ${element.content.toUpperCase()}\n\n`
        break
      case 'shot':
        text += `${element.content.toUpperCase()}\n\n`
        break
    }
  })
  
  return text
}

// Convert script elements to Final Draft XML format
export function exportToFinalDraft(elements: ScriptElement[], title: string): string {
  let fdx = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="1">

<Content>
<Paragraph Type="Action">
<Text>${title}</Text>
</Paragraph>

<Paragraph Type="Action">
<Text>Written by</Text>
</Paragraph>

<Paragraph Type="Action">
<Text>AuthenticVoice User</Text>
</Paragraph>

<Paragraph Type="Action">
<Text></Text>
</Paragraph>

`

  elements.forEach(element => {
    if (!element.content.trim()) return
    
    let fdxType = ''
    let content = element.content
    
    switch (element.type) {
      case 'scene_heading':
        fdxType = 'Scene Heading'
        content = content.toUpperCase()
        break
      case 'action':
        fdxType = 'Action'
        break
      case 'character':
        fdxType = 'Character'
        content = content.toUpperCase()
        break
      case 'dialogue':
        fdxType = 'Dialogue'
        break
      case 'parenthetical':
        fdxType = 'Parenthetical'
        break
      case 'transition':
        fdxType = 'Transition'
        content = content.toUpperCase()
        break
      case 'shot':
        fdxType = 'Shot'
        content = content.toUpperCase()
        break
    }
    
    fdx += `<Paragraph Type="${fdxType}">
<Text>${escapeXml(content)}</Text>
</Paragraph>

`
  })
  
  fdx += `</Content>
</FinalDraft>`
  
  return fdx
}

// Escape XML characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Generate PDF using browser's print functionality
export function exportToPDF(elements: ScriptElement[], title: string): void {
  // Create a new window with properly formatted screenplay
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to export PDF')
    return
  }
  
  const html = generatePrintableHTML(elements, title)
  
  printWindow.document.write(html)
  printWindow.document.close()
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print()
    // Don't close automatically - let user choose
  }, 500)
}

// Generate HTML for PDF export with proper screenplay formatting
function generatePrintableHTML(elements: ScriptElement[], title: string): string {
  let content = ''
  
  elements.forEach(element => {
    if (!element.content.trim()) return
    
    const safeContent = escapeHtml(element.content)
    
    switch (element.type) {
      case 'scene_heading':
        content += `<div class="scene-heading">${safeContent.toUpperCase()}</div>`
        break
      case 'action':
        content += `<div class="action">${safeContent}</div>`
        break
      case 'character':
        content += `<div class="character">${safeContent.toUpperCase()}</div>`
        break
      case 'dialogue':
        content += `<div class="dialogue">${safeContent}</div>`
        break
      case 'parenthetical':
        content += `<div class="parenthetical">${safeContent}</div>`
        break
      case 'transition':
        content += `<div class="transition">${safeContent.toUpperCase()}</div>`
        break
      case 'shot':
        content += `<div class="shot">${safeContent.toUpperCase()}</div>`
        break
    }
  })
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>${escapeHtml(title)}</title>
    <style>
        @page {
            size: 8.5in 11in;
            margin: 1in 1in 1in 1.25in;
        }
        
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12pt;
            line-height: 1.2;
            margin: 0;
            padding: 0;
            color: black;
            background: white;
        }
        
        .title-page {
            page-break-after: always;
            text-align: center;
            padding-top: 3in;
        }
        
        .title {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 2in;
        }
        
        .author {
            font-size: 14pt;
            margin-bottom: 0.5in;
        }
        
        .scene-heading {
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 12pt;
            margin-bottom: 0;
            page-break-after: avoid;
        }
        
        .action {
            margin-top: 12pt;
            margin-bottom: 0;
            margin-right: 1in;
        }
        
        .character {
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 12pt;
            margin-bottom: 0;
            margin-left: 3in;
            page-break-after: avoid;
        }
        
        .dialogue {
            margin-top: 0;
            margin-bottom: 0;
            margin-left: 2in;
            margin-right: 2in;
        }
        
        .parenthetical {
            margin-top: 0;
            margin-bottom: 0;
            margin-left: 2.5in;
            margin-right: 2in;
        }
        
        .transition {
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 12pt;
            margin-bottom: 12pt;
            text-align: right;
            margin-right: 0;
        }
        
        .shot {
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 12pt;
            margin-bottom: 0;
        }
        
        /* Prevent orphaned dialogue */
        .character {
            page-break-after: avoid;
        }
        
        .character + .dialogue {
            page-break-before: avoid;
        }
        
        /* Print-specific styles */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="title-page">
        <div class="title">${escapeHtml(title)}</div>
        <div class="author">Written by<br>AuthenticVoice User</div>
    </div>
    
    <div class="screenplay">
        ${content}
    </div>
</body>
</html>`
}

// Escape HTML characters
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Download file with given content
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Main export function
export function exportScript(
  elements: ScriptElement[], 
  title: string, 
  format: ExportFormat
): void {
  const safeTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Screenplay'
  
  switch (format) {
    case 'pdf':
      exportToPDF(elements, title)
      break
      
    case 'fdx':
      const fdxContent = exportToFinalDraft(elements, title)
      downloadFile(fdxContent, `${safeTitle}.fdx`, 'application/xml')
      break
      
    case 'fountain':
      const fountainContent = exportToFountain(elements, title)
      downloadFile(fountainContent, `${safeTitle}.fountain`, 'text/plain')
      break
      
    case 'txt':
      const textContent = exportToText(elements, title)
      downloadFile(textContent, `${safeTitle}.txt`, 'text/plain')
      break
      
    default:
      console.error('Unsupported export format:', format)
  }
}