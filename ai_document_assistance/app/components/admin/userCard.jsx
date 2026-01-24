import React, { Activity } from 'react'
import UserTable from './userTable'
import { ArrowLeft, UserCog, Users } from 'lucide-react'

const UserCard = ({ showUsersTable, setShowUsersTable }) => {
  return (
    <>
      {!showUsersTable ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Users Card */}
          <button
            onClick={() => setShowUsersTable(true)}
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
                  <Users className="h-6 w-6 text-purple-300 group-hover:text-purple-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    Manage
                  </p>
                  <h2 className="text-xl font-semibold text-white">Users</h2>
                </div>
              </div>

              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                View, activate, and manage registered users
              </p>

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
      ) : (
        <div className="animate-in fade-in duration-300">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowUsersTable(false)}
              className="
                inline-flex items-center gap-2
                rounded-lg bg-white/10 px-4 py-2.5
                text-sm font-medium text-white
                border border-white/20
                hover:bg-white/20 hover:border-white/30
                active:scale-95
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent
              "
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-600/30 p-2">
                <Users className="h-5 w-5 text-purple-300" />
              </div>
              <h2 className="text-2xl font-bold text-white">All Users</h2>
            </div>
          </div>

          {/* Table container */}
          <div className="
            rounded-xl
            bg-gradient-to-br from-white/10 to-white/5
            backdrop-blur-md
            border border-white/20
            shadow-xl
            p-6
            animate-in slide-in-from-bottom-4 duration-500
          ">
            <UserTable />
          </div>
        </div>
      )}
    </>
  )
}

export default UserCard