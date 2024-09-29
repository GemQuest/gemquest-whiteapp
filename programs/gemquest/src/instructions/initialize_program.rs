use anchor_lang::prelude::*;


/**
* Initializes the program with the admin pubkey
*/
pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
    let program_admin = &mut ctx.accounts.program_admin;

    if program_admin.is_initialized {
        return Err(ErrorCode::AlreadyInitialized.into());
    }

    program_admin.admin = ctx.accounts.payer.key(); 
    program_admin.is_initialized = true;

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + (32 + 1), // prefix + ProgramAdmin(pubkey + bool) 
        seeds = [b"program_admin"],
        bump,
    )]
    pub program_admin: Account<'info, ProgramAdmin>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ProgramAdmin {
    pub admin: Pubkey,
    pub is_initialized: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Program is already initialized")]
    AlreadyInitialized,
}