import "./style.css"

import { useState } from "react"

const Popup = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleAutofill = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })

    if (!tab?.id) return

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (email: string, password: string) => {
          // Autofill email fields
          const emailSelectors = [
            'input[type="email"]',
            'input[name*="email" i]',
            'input[id*="email" i]',
            'input[placeholder*="email" i]'
          ]

          emailSelectors.forEach((selector) => {
            const elements = document.querySelectorAll(selector)
            elements.forEach((element) => {
              if (element instanceof HTMLInputElement) {
                element.value = email
                element.dispatchEvent(new Event("input", { bubbles: true }))
                element.dispatchEvent(new Event("change", { bubbles: true }))
              }
            })
          })

          // Autofill password fields
          const passwordSelectors = [
            'input[type="password"]',
            'input[name*="pass" i]',
            'input[id*="pass" i]',
            'input[placeholder*="pass" i]'
          ]

          passwordSelectors.forEach((selector) => {
            const elements = document.querySelectorAll(selector)
            elements.forEach((element) => {
              if (element instanceof HTMLInputElement) {
                element.value = password
                element.dispatchEvent(new Event("input", { bubbles: true }))
                element.dispatchEvent(new Event("change", { bubbles: true }))
              }
            })
          })
        },
        args: [email, password]
      })
    } catch (error) {
      console.error("Autofill failed:", error)
    }
  }

  return (
    <div className="w-80 p-4 bg-white">
      <h1 className="text-xl font-bold mb-4 text-gray-800">Form Autofill</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="user@example.com"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="••••••••"
        />
      </div>

      <button
        onClick={handleAutofill}
        disabled={!email || !password}
        className={`w-full p-2 rounded font-medium transition-colors ${
          email && password
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}>
        Fill Forms
      </button>

      <div className="mt-4 text-xs text-gray-500">
        <p>Works on login and registration forms</p>
      </div>
    </div>
  )
}

export default Popup
