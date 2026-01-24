import { ArrowLeft, Settings } from 'lucide-react'
import React from 'react'
import ApiConfigTable from './apiConfigTable'

const ConfigCard = ({showConfigTable, setShowConfigTable}) => {
  return (
    <>
    
    {
        !showConfigTable ? (
                    <>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setShowConfigTable(true)}
            className="
              group relative rounded-xl p-6
              bg-gradient-to-br from-white/10 to-white/5
              backdrop-blur-md
              border border-white/20
              shadow-lg
              transition-all duration-300
              hover:-translate-y-2 hover:shadow-2xl
              hover:border-purple-400/50
              text-left
              overflow-hidden
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent
            "
            aria-label="View and manage users"
          >
            {/* Gradient overlay on hover */}
            <div className="
              absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0
              group-hover:from-purple-600/10 group-hover:to-purple-600/5
              transition-all duration-300
            " />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="
                  rounded-lg bg-purple-600/30 p-3
                  group-hover:bg-purple-600/50
                  group-hover:scale-110
                  transition-all duration-300
                ">
                  <Settings className="h-6 w-6 text-purple-300 group-hover:text-purple-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    Manage
                  </p>
                  <h2 className="text-xl font-semibold text-white">API Configuration</h2>
                </div>
              </div>

              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
Manage encrypted API keys and tokens              </p>

              {/* Arrow indicator */}
              <div className="
                mt-4 flex items-center gap-2 text-purple-400
                opacity-0 group-hover:opacity-100
                transform translate-x-0 group-hover:translate-x-1
                transition-all duration-300
              ">
                <span className="text-sm font-medium">Manage now</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </div>
            </div>
          </button>
        </div>
          </>  
        ) : (
            <>
                        <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setShowConfigTable(false)}
                className="
                  inline-flex items-center gap-2
                  rounded-md bg-white/10 px-4 py-2
                  text-sm font-medium
                  border border-white/20
                  transition
                  text-white
                "
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>

              <h2 className="text-2xl font-bold">API Configurations</h2>
            </div>

            <div
              className="
                rounded-xl
                bg-white/10 backdrop-blur-md
                border border-white/20
                shadow-xl
                text-white
                p-4
              "
            >
              <ApiConfigTable />
            </div>

            </>  
            
        )
    }
    </>
  )
}

export default ConfigCard
