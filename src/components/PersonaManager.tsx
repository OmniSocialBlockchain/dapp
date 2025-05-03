import { useState, useEffect } from "react";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { personaNFT } from "@/contracts/PersonaNFT";
import { useIPFS } from "@/hooks/useIPFS";

interface Persona {
  username: string;
  label: string;
  bio: string;
  avatar: string;
  isActive: boolean;
}

export function PersonaManager() {
  const { address } = useAccount();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [newPersona, setNewPersona] = useState({
    username: "",
    label: "",
    bio: "",
    avatar: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { uploadToIPFS } = useIPFS();

  const { data: personaIds } = useContractRead({
    ...personaNFT,
    functionName: "getPersonasByOwner",
    args: [address],
    watch: true,
  });

  const { write: createPersona } = useContractWrite({
    ...personaNFT,
    functionName: "createPersona",
  });

  const { write: updatePersona } = useContractWrite({
    ...personaNFT,
    functionName: "updatePersona",
  });

  const { write: deactivatePersona } = useContractWrite({
    ...personaNFT,
    functionName: "deactivatePersona",
  });

  const { write: reactivatePersona } = useContractWrite({
    ...personaNFT,
    functionName: "reactivatePersona",
  });

  useEffect(() => {
    const fetchPersonas = async () => {
      if (!personaIds) return;

      const personaData = await Promise.all(
        personaIds.map(async (tokenId) => {
          const { data } = await useContractRead({
            ...personaNFT,
            functionName: "getPersona",
            args: [tokenId],
          });
          return data;
        })
      );

      setPersonas(personaData);
    };

    fetchPersonas();
  }, [personaIds]);

  const handleCreatePersona = async () => {
    try {
      setIsLoading(true);
      const metadata = {
        name: newPersona.username,
        description: newPersona.bio,
        image: newPersona.avatar,
        attributes: [
          { trait_type: "Label", value: newPersona.label },
        ],
      };

      const tokenURI = await uploadToIPFS(JSON.stringify(metadata));

      await createPersona({
        args: [
          address,
          newPersona.username,
          newPersona.label,
          newPersona.bio,
          newPersona.avatar,
          tokenURI,
        ],
      });

      setNewPersona({
        username: "",
        label: "",
        bio: "",
        avatar: "",
      });
    } catch (error) {
      console.error("Error creating persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePersona = async (tokenId: number, updatedPersona: Persona) => {
    try {
      setIsLoading(true);
      await updatePersona({
        args: [
          tokenId,
          updatedPersona.username,
          updatedPersona.label,
          updatedPersona.bio,
          updatedPersona.avatar,
        ],
      });
    } catch (error) {
      console.error("Error updating persona:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Your Personas</h2>

      {/* Create New Persona */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Create New Persona</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={newPersona.username}
            onChange={(e) =>
              setNewPersona({ ...newPersona, username: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Label"
            value={newPersona.label}
            onChange={(e) =>
              setNewPersona({ ...newPersona, label: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <textarea
            placeholder="Bio"
            value={newPersona.bio}
            onChange={(e) =>
              setNewPersona({ ...newPersona, bio: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Avatar URL"
            value={newPersona.avatar}
            onChange={(e) =>
              setNewPersona({ ...newPersona, avatar: e.target.value })
            }
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={handleCreatePersona}
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Persona"}
          </button>
        </div>
      </div>

      {/* Existing Personas */}
      <div className="space-y-6">
        {personas.map((persona, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center space-x-4">
              <img
                src={persona.avatar}
                alt={persona.username}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h3 className="text-xl font-semibold">{persona.username}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {persona.label}
                </p>
              </div>
            </div>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              {persona.bio}
            </p>
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => handleUpdatePersona(index, persona)}
                disabled={isLoading}
                className="bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:opacity-50"
              >
                Update
              </button>
              {persona.isActive ? (
                <button
                  onClick={() => deactivatePersona({ args: [index] })}
                  disabled={isLoading}
                  className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => reactivatePersona({ args: [index] })}
                  disabled={isLoading}
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 