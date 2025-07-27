import "./style.css"

import { useEffect, useState } from "react"

// Define credential type
type Credential = {
  id: string
  email: string
  password: string
  createdAt: number
}

const Popup = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [activeView, setActiveView] = useState<"list" | "add">("list")

  // Load saved credentials on mount
  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    try {
      const result = await chrome.storage.local.get(["credentials"])
      const savedCredentials = result.credentials || []
      setCredentials(savedCredentials)
    } catch (error) {
      console.error("Failed to load credentials:", error)
    }
  }

  const saveCredential = async () => {
    if (!email || !password) {
      alert("Please enter both email and password")
      return
    }

    try {
      const newCredential: Credential = {
        id: Date.now().toString(),
        email,
        password,
        createdAt: Date.now()
      }

      const updatedCredentials = [...credentials, newCredential]
      await chrome.storage.local.set({ credentials: updatedCredentials })
      setCredentials(updatedCredentials)
      setEmail("")
      setPassword("")
      setActiveView("list") // Switch back to list view after saving
    } catch (error) {
      console.error("Failed to save credential:", error)
      alert("Failed to save credential")
    }
  }

  const deleteCredential = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) return

    try {
      const updatedCredentials = credentials.filter((cred) => cred.id !== id)
      await chrome.storage.local.set({ credentials: updatedCredentials })
      setCredentials(updatedCredentials)
    } catch (error) {
      console.error("Failed to delete credential:", error)
      alert("Failed to delete credential")
    }
  }

  const autofillCredential = async (cred: Credential) => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })

    if (!tab?.id) {
      alert("No active tab found")
      return
    }

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
        args: [cred.email, cred.password]
      })

      // Close popup after successful autofill
      window.close()
    } catch (error) {
      console.error("Autofill failed:", error)
      alert("Autofill failed. Make sure you're on a page with forms.")
    }
  }

  return (
    <div className="w-96 p-4 bg-white min-h-[400px]">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Saved Credentials
      </h1>

      {/* Add New Credential View */}
      {activeView === "add" && (
        <div>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 text-gray-500 text-sm"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveCredential}
              className="flex-1 p-2 rounded font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Save Credential
            </button>
            <button
              onClick={() => setActiveView("list")}
              className="p-2 rounded font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
              Cancel
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>Credentials are stored locally on your device only.</p>
          </div>
        </div>
      )}

      {/* Credentials List View */}
      {activeView === "list" && (
        <div>
          {credentials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No saved credentials yet</p>
              <button
                onClick={() => setActiveView("add")}
                className="p-2 rounded font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                Add Your First Credential
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  {credentials.length} Credential
                  {credentials.length !== 1 ? "s" : ""}
                </h2>
                <button
                  onClick={() => setActiveView("add")}
                  className="p-2 rounded font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm">
                  + Add New
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="border rounded-lg p-3 hover:bg-blue-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div
                        className="cursor-pointer flex-1"
                        onClick={() => autofillCredential(cred)}>
                        <div className="font-medium text-gray-800 truncate">
                          {cred.email}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Added: {new Date(cred.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteCredential(cred.id)}
                        className="text-red-500 hover:text-red-700 ml-2 p-1"
                        title="Delete credential">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={() => autofillCredential(cred)}
                        className="w-full py-2 rounded font-medium bg-green-600 text-white hover:bg-green-700 transition-colors text-sm">
                        Fill Forms with This
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Popup
