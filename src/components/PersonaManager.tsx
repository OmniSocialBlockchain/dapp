import { useState, useEffect, useCallback } from "react";
import { useAccount, useContractRead, useContractWrite, useWatchContractEvent } from "wagmi";
import { personaNFT } from "@/contracts/PersonaNFT";
import { useIPFS } from "@/hooks/useIPFS";
import { Address, Log } from "viem";
import { toast } from "sonner";

interface Persona {
  username: string;
  label: string;
  bio: string;
  avatar: string;
  isActive: boolean;
  tokenId: bigint;
}

type PersonaData = [
  string, // username
  string, // label
  string, // bio
  string, // avatar
  boolean // isActive
];

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
    address: personaNFT.address,
    abi: personaNFT.abi,
    functionName: "getPersonasByOwner",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  // Read all personas at once
  const { data: personasData } = useContractRead({
    address: personaNFT.address,
    abi: personaNFT.abi,
    functionName: "getPersonas",
    args: personaIds ? [personaIds] : undefined,
    enabled: !!personaIds?.length,
  });

  const { writeContract: createPersona, isPending: isCreatePending } = useContractWrite();
  const { writeContract: updatePersona, isPending: isUpdatePending } = useContractWrite();
  const { writeContract: deactivatePersona, isPending: isDeactivatePending } = useContractWrite();
  const { writeContract: reactivatePersona, isPending: isReactivatePending } = useContractWrite();

  useWatchContractEvent({
    address: personaNFT.address,
    abi: personaNFT.abi,
    eventName: "PersonaCreated",
    onLogs: (logs: Log[]) => {
      toast.success("New persona created");
    },
  });

  useWatchContractEvent({
    address: personaNFT.address,
    abi: personaNFT.abi,
    eventName: "PersonaUpdated",
    onLogs: (logs: Log[]) => {
      toast.success("Persona updated successfully");
    },
  });

  useWatchContractEvent({
    address: personaNFT.address,
    abi: personaNFT.abi,
    eventName: "PersonaDeactivated",
    onLogs: (logs: Log[]) => {
      toast.success("Persona deactivated successfully");
    },
  });

  useWatchContractEvent({
    address: personaNFT.address,
    abi: personaNFT.abi,
    eventName: "PersonaReactivated",
    onLogs: (logs: Log[]) => {
      toast.success("Persona reactivated successfully");
    },
  });

  useEffect(() => {
    if (personasData) {
      const formattedPersonas = (personasData as PersonaData[]).map((data, index) => ({
        username: data[0],
        label: data[1],
        bio: data[2],
        avatar: data[3],
        isActive: data[4],
        tokenId: BigInt(index),
      }));
      setPersonas(formattedPersonas);
    }
  }, [personasData]);

  const handleCreatePersona = async () => {
    try {
      setIsLoading(true);

      if (!newPersona.username || !newPersona.label || !newPersona.bio) {
        throw new Error("Please fill in all required fields");
      }

      let avatarHash = newPersona.avatar;
      if (newPersona.avatar) {
        avatarHash = await uploadToIPFS(newPersona.avatar);
      }

      await createPersona({
        address: personaNFT.address,
        abi: personaNFT.abi,
        functionName: "createPersona",
        args: [newPersona.username, newPersona.label, newPersona.bio, avatarHash],
      });

      toast.success("Persona created successfully");
      setNewPersona({
        username: "",
        label: "",
        bio: "",
        avatar: "",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create persona";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePersona = async (tokenId: bigint, updatedPersona: Persona) => {
    try {
      setIsLoading(true);

      if (!updatedPersona.username || !updatedPersona.label || !updatedPersona.bio) {
        throw new Error("Please fill in all required fields");
      }

      let avatarHash = updatedPersona.avatar;
      if (updatedPersona.avatar) {
        avatarHash = await uploadToIPFS(updatedPersona.avatar);
      }

      await updatePersona({
        address: personaNFT.address,
        abi: personaNFT.abi,
        functionName: "updatePersona",
        args: [tokenId, updatedPersona.username, updatedPersona.label, updatedPersona.bio, avatarHash],
      });

      toast.success("Persona updated successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update persona";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivatePersona = async (tokenId: bigint) => {
    try {
      setIsLoading(true);

      await deactivatePersona({
        address: personaNFT.address,
        abi: personaNFT.abi,
        functionName: "deactivatePersona",
        args: [tokenId],
      });

      toast.success("Persona deactivated successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to deactivate persona";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivatePersona = async (tokenId: bigint) => {
    try {
      setIsLoading(true);

      await reactivatePersona({
        address: personaNFT.address,
        abi: personaNFT.abi,
        functionName: "reactivatePersona",
        args: [tokenId],
      });

      toast.success("Persona reactivated successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reactivate persona";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Create New Persona</h2>
        <input
          type="text"
          value={newPersona.username}
          onChange={(e) => setNewPersona({ ...newPersona, username: e.target.value })}
          placeholder="Username"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          value={newPersona.label}
          onChange={(e) => setNewPersona({ ...newPersona, label: e.target.value })}
          placeholder="Label"
          className="w-full p-2 border rounded"
        />
        <textarea
          value={newPersona.bio}
          onChange={(e) => setNewPersona({ ...newPersona, bio: e.target.value })}
          placeholder="Bio"
          className="w-full p-2 border rounded"
          rows={4}
        />
        <input
          type="text"
          value={newPersona.avatar}
          onChange={(e) => setNewPersona({ ...newPersona, avatar: e.target.value })}
          placeholder="Avatar URL"
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleCreatePersona}
          disabled={isLoading || isCreatePending}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isLoading || isCreatePending ? "Creating..." : "Create Persona"}
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Your Personas</h2>
        {personas.map((persona) => (
          <div key={persona.tokenId.toString()} className="p-4 border rounded space-y-2">
            <h3 className="font-bold">{persona.username}</h3>
            <p>Label: {persona.label}</p>
            <p>Bio: {persona.bio}</p>
            <p>Status: {persona.isActive ? "Active" : "Inactive"}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleUpdatePersona(persona.tokenId, persona)}
                disabled={isLoading || isUpdatePending}
                className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
              >
                Update
              </button>
              {persona.isActive ? (
                <button
                  onClick={() => handleDeactivatePersona(persona.tokenId)}
                  disabled={isLoading || isDeactivatePending}
                  className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => handleReactivatePersona(persona.tokenId)}
                  disabled={isLoading || isReactivatePending}
                  className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
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